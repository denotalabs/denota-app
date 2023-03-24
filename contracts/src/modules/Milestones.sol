// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/utils/Strings.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";

/**
 * @notice Contract: stores invoice structs, allows freelancer/client to set work status'
 * 1) Milestone invoice is created
    a) if the caller is the owner, caller is the worker.
    b) if the caller isn't the owner, caller is the client.
        i) ensure that the first milestone amount is escrowed or instant sent (increment if instant as the upfront)
 * 2) Work is done
 * 3) Cashing is executed
    a) if the caller is the owner, they are trying to cash the milestone
 * Releasing a milestone requires the funder to escrow the next milestone
 * Disputation is not supported
 * Transfers are not supported
 * The funder can cash the escrowed milestone, if remaining, which revokes the invoice until it's escrowed again.
 * IDEA: could add make each milestone a ReversibleTimelock
 * QUESTION: should worker need to claim the milestones manually? (for now)
 * QUESTION: Should client only be allowed to fund one milestone at a time? (for now)
 */
contract Milestones is ModuleBase {
    struct Milestone {
        uint256 amount;
        // bool isEscrowed;
        bool isCashed;
    }
    struct Invoice {
        uint256 startTime;
        uint256 currentMilestone; // currentMilestone := currently funded but not released
        uint256 totalMilestones;
        address client;
        address worker;
        bytes32 documentHash;
        bool isRevoked; // Happens when client revokes the currentMilestone's escrow
    }
    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => Milestone[]) public milestones;

    error InvoiceWithPay();
    error InsufficientPayment();
    error AddressZero();
    error Disallowed();
    error OnlyOwner();
    error OnlyOwnerOrApproved();
    error InsufficientMilestones();
    error AllMilestonesFunded();
    error OnlyOwnerOrClient();
    error OnlyWorkerOrClient();
    error OnlyClient();
    error InstantOnlyUpfront();

    event Invoiced(
        uint256 cheqId,
        address toNotify,
        bytes32 docHash,
        uint256[] milestoneAmounts
    );

    constructor(
        address registrar,
        DataTypes.WTFCFees memory _fees,
        string memory __baseURI
    ) ModuleBase(registrar, _fees) {
        _URI = __baseURI;
    }

    function processWrite(
        address caller,
        address owner,
        uint256 cheqId,
        address currency,
        uint256 escrowed,
        uint256 instant,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        (
            address toNotify,
            address dappOperator,
            bytes32 docHash,
            uint256[] memory milestoneAmounts
        ) = abi.decode(initData, (address, address, bytes32, uint256[]));

        uint256 totalMilestones = milestoneAmounts.length;
        if (totalMilestones < 2) revert InsufficientMilestones();

        // TODO optimize milestones.push() logic
        // Invoice
        if (caller == owner) {
            if (instant != 0 || escrowed != 0) revert InvoiceWithPay();
            invoices[cheqId].worker = caller;
            invoices[cheqId].client = toNotify;
            for (uint256 i = 0; i < totalMilestones; i++) {
                milestones[cheqId].push(
                    Milestone({amount: milestoneAmounts[i], isCashed: false})
                );
            }
        }
        // Payment
        else if (toNotify == owner) {
            if (owner == address(0)) revert AddressZero();
            invoices[cheqId].worker = toNotify;
            invoices[cheqId].client = caller;
            invoices[cheqId].startTime = block.timestamp;

            // If instant is used, that must be first milestone (upfront) and second must be funded
            if (instant == milestoneAmounts[0]) {
                if (escrowed != milestoneAmounts[1])
                    revert InsufficientPayment();

                invoices[cheqId].currentMilestone += 1;

                milestones[cheqId].push(
                    Milestone({amount: milestoneAmounts[0], isCashed: true})
                );

                for (uint256 i = 1; i < totalMilestones; i++) {
                    milestones[cheqId].push(
                        Milestone({
                            amount: milestoneAmounts[i],
                            isCashed: false
                        })
                    );
                }
            }
            // Instant is not used, first milestone must be funded
            else {
                if (escrowed != milestoneAmounts[0])
                    revert InsufficientPayment();
                for (uint256 i; i < totalMilestones; i++) {
                    milestones[cheqId].push(
                        Milestone({
                            amount: milestoneAmounts[i],
                            isCashed: false
                        })
                    );
                }
            }
        } else {
            revert Disallowed();
        }

        invoices[cheqId].totalMilestones = totalMilestones;
        invoices[cheqId].documentHash = docHash;
        emit Invoiced(cheqId, toNotify, docHash, milestoneAmounts);
        return takeReturnFee(currency, escrowed + instant, dappOperator, 0);
    }

    function processTransfer(
        address /*caller*/,
        address /*approved*/,
        address /*owner*/,
        address /*from*/,
        address /*to*/,
        uint256 /*cheqId*/,
        address /*currency*/,
        uint256 /*escrowed*/,
        uint256 /*createdAt*/,
        bytes memory /*data*/
    ) external view override onlyRegistrar returns (uint256) {
        // if (caller != owner && caller != approved) revert OnlyOwnerOrApproved(); // Question: enable for invoice factoring?
        revert Disallowed();
    }

    // TODO add revoked variable to the logic
    function processFund(
        address /*caller*/,
        address /*owner*/,
        uint256 escrowed,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        // if (caller == owner) revert NotOwner();  // Prob not necessary
        // if (caller != invoices[cheqId].client) revert NotClient();  // Prob not necessary
        uint256 currentMilestone = invoices[cheqId].currentMilestone; // QUESTION: Is this a pointer or a separate var?

        // First funding of an invoice. Technically currentMilestone was -1 so don't increment (zero init)
        if (invoices[cheqId].startTime == 0) {
            invoices[cheqId].startTime = block.timestamp;
            // Can use instant pay on first funding
            if (instant == milestones[cheqId][currentMilestone].amount)
                invoices[cheqId].currentMilestone += 1;
        } else if (!invoices[cheqId].isRevoked) {
            if (instant != 0) revert InstantOnlyUpfront();

            invoices[cheqId].currentMilestone += 1;

            if (currentMilestone == invoices[cheqId].totalMilestones)
                revert AllMilestonesFunded();
        } else {
            invoices[cheqId].isRevoked = false;
        }
        // if isRevoked was true then don't increment milestones- the escrowed amount reverted it to not revoked
        if (escrowed != milestones[cheqId][currentMilestone].amount)
            revert InsufficientPayment();

        return
            takeReturnFee(
                cheq.currency,
                escrowed + instant,
                abi.decode(initData, (address)),
                2
            );
    }

    // Allow the funder or owner to cash the current milestone
    function processCash(
        address caller,
        address owner,
        address to,
        uint256 amount, // Question: This could function as the milestone index if the cashing amount was determined by the module's return value for `amount`
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        // Any caller can cash milestones < currentMilestone (when `to` := worker)
        (uint256 cashingMilestone, address dappOperator) = abi.decode(
            initData,
            (uint256, address)
        );
        require(
            cashingMilestone < invoices[cheqId].currentMilestone,
            "Not cashable yet"
        );
        require(invoices[cheqId].startTime != 0, "Not funded yet");
        // Client is taking back escrow
        if (caller == invoices[cheqId].client) {
            require(
                amount ==
                    milestones[cheqId][invoices[cheqId].currentMilestone]
                        .amount,
                "wrong amount"
            );
            invoices[cheqId].isRevoked = true;
        } else if (to == owner) {
            require(
                amount == milestones[cheqId][cashingMilestone].amount,
                "wrong amount"
            );
            milestones[cheqId][cashingMilestone].isCashed = true;
        } else {
            revert Disallowed();
        }

        return takeReturnFee(cheq.currency, amount, dappOperator, 3);
    }

    function processApproval(
        address /*caller*/,
        address /*owner*/,
        address /*to*/,
        uint256 /*cheqId*/,
        DataTypes.Cheq calldata /*cheq*/,
        bytes memory /*initDat*/
    ) external view override onlyRegistrar {
        // if (caller != owner) revert OnlyOwner(); // Question: enable for invoice factoring?
        revert Disallowed();
    }

    function processTokenURI(
        uint256 tokenId
    ) public view override onlyRegistrar returns (string memory) {
        string memory __baseURI = _baseURI();
        return
            bytes(__baseURI).length > 0
                ? string(abi.encodePacked(_URI, tokenId))
                : "";
    }

    function _baseURI() internal view returns (string memory) {
        return _URI;
    }

    // function setBaseURI(string calldata __baseURI) external onlyOwner {
    //     _URI = __baseURI;
    // }

    function getMilestones(
        uint256 cheqId
    ) public view returns (Milestone[] memory) {
        return milestones[cheqId];
    }

    // Question: Should worker be able to add/remove milestones?
    function addMilestone(uint256 cheqId, uint256 amount) public {
        if (msg.sender != invoices[cheqId].client) revert OnlyClient();
        milestones[cheqId].push(Milestone({amount: amount, isCashed: false}));
        invoices[cheqId].totalMilestones += 1;
    }

    function removeMilestone(uint256 cheqId) public {
        if (msg.sender != invoices[cheqId].client) revert OnlyClient();
        require(
            invoices[cheqId].currentMilestone + 1 <
                invoices[cheqId].totalMilestones,
            "Can't delete current milestone"
        );

        delete milestones[cheqId][invoices[cheqId].totalMilestones - 1];
        invoices[cheqId].totalMilestones -= 1;
    }
}

// if (caller == invoice.client) {
//     // Todo Client is getting refund on current milestone
// } else if (caller == invoice.worker) {
//     require(caller == invoices[cheqId].worker, "Only workers can cash"); // can use `to` so others can cash on behalf
//     uint256 cashingMilestone = abi.decode(initData, (uint256));
//     require(cashingMilestone <= currentMilestone, "Can't cash yet");
//     milestones[cheqId][currentMilestone - 1].isCashed = true;
// } else if (caller != address(this)) {
//     require(false, "Disallowed");
// }

/// Supporting instant + escrow on additional funding
// // First funding of an invoice. Technically currentMilestone was -1 so don't increment (zero init)
// if (invoices[cheqId].startTime == 0) {
//     invoices[cheqId].startTime = block.timestamp;
// } else {
//     invoices[cheqId].currentMilestone += 1;
//     if (currentMilestone == invoices[cheqId].totalMilestones)
//         revert AllMilestonesFunded();
// }

// // QUESTION: support instant on not first payment?
// if (instant == milestones[cheqId][currentMilestone].amount) {
//     invoices[cheqId].currentMilestone += 1;
//     if (currentMilestone == invoices[cheqId].totalMilestones) {
//         if (escrowed != 0) revert AllMilestonesFunded();
//     }
//     return
//         takeReturnFee(
//             cheq.currency,
//             escrowed + instant,
//             abi.decode(initData, (address))
//         );
// }
// if (escrowed != milestones[cheqId][currentMilestone].amount)
//     revert InsufficientPayment();
