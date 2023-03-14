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
 * Allows the funder to release the milestones whenever they wish
 * Releasing a milestone requires them to fund the next one
 * Disputation is not supported
 * Transfers are not supported
 * QUESTION: should client need to claim the milestones manually?
 */
contract Milestones is ModuleBase {
    struct Milestone {
        uint256 amount;
        bool isCashed;
    }
    struct Invoice {
        address client;
        address worker;
        uint256 startTime;
        uint256 currentMilestone;
        uint256 totalMilestones;
        bytes32 documentHash;
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
    error OnlyOwnerOrClient();
    error OnlyWorkerOrClient();
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

        // Invoice
        if (caller == owner) {
            if (instant != 0) revert InvoiceWithPay();
            invoices[cheqId].worker = caller;
            invoices[cheqId].client = toNotify;
        }
        // Payment
        else if (owner == toNotify) {
            if (owner == address(0)) revert AddressZero();
            invoices[cheqId].worker = toNotify;
            invoices[cheqId].client = caller;
            invoices[cheqId].startTime = block.timestamp;
            // If first milestone is not escrowed, make sure it is paid (first milestone is encoded as upfront)
            if (escrowed != milestoneAmounts[0]) {
                if (instant != milestoneAmounts[0])
                    revert InsufficientPayment();
                invoices[cheqId].currentMilestone += 1;
            }
        } else {
            revert Disallowed();
        }

        uint256 totalMilestones = milestoneAmounts.length;
        if (totalMilestones < 2) revert InsufficientMilestones();

        invoices[cheqId].totalMilestones = totalMilestones;
        invoices[cheqId].documentHash = docHash;

        // TODO can optimize
        for (uint256 i = 0; i < totalMilestones; i++) {
            milestones[cheqId].push(
                Milestone({amount: milestoneAmounts[i], isCashed: false})
            );
        }
        emit Invoiced(cheqId, toNotify, docHash, milestoneAmounts); // TODO need to emit more parameters
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

    function processFund(
        /// Should instant be allowed here instead of escrow?
        address /*caller*/,
        address /*owner*/,
        uint256 amount,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        // if (caller == owner) revert NotOwner();  // Prob not necessary
        if (
            amount !=
            milestones[cheqId][invoices[cheqId].currentMilestone].amount
        ) revert InsufficientPayment();

        // If this is an invoice, the client must instant pay the first milestone and escrow the second
        if (invoices[cheqId].startTime == 0) {
            invoices[cheqId].startTime = block.timestamp; // If first milestone
        }
        // ICheqRegistrar(REGISTRAR).cash( // Where the worker should be paid BUG: this doesn't work since escrow happens after fund()
        //     cheqId,
        //     amount,
        //     invoices[cheqId].worker,
        //     bytes("")
        // );

        invoices[cheqId].currentMilestone += 1;

        return
            takeReturnFee(
                cheq.currency,
                amount + instant,
                abi.decode(initData, (address)),
                2
            );
    }

    // Allow the funder or owner to cash the current milestone
    function processCash(
        address /*caller*/,
        address owner,
        address to,
        uint256 amount,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        if (to != owner && to != invoices[cheqId].client)
            revert OnlyOwnerOrClient();
        if (
            amount !=
            milestones[cheqId][invoices[cheqId].currentMilestone].amount
        ) revert InsufficientPayment();
        invoices[cheqId].currentMilestone += 1;

        return
            takeReturnFee(
                cheq.currency,
                amount,
                abi.decode(initData, (address)),
                3
            );
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
        // string memory _URI = _baseURI();
        // Question: should milestones include an image?
        return
            bytes(_URI).length > 0
                ? string(abi.encodePacked(',"external_url":', _URI, tokenId))
                : "";
    }

    function getMilestones(
        uint256 cheqId
    ) public view returns (Milestone[] memory) {
        return milestones[cheqId];
    }

    function addMilestone(uint256 cheqId, uint256 amount) public {
        if (
            msg.sender != invoices[cheqId].worker &&
            msg.sender != invoices[cheqId].client
        ) revert OnlyWorkerOrClient();
        milestones[cheqId].push(Milestone({amount: amount, isCashed: false}));
        invoices[cheqId].totalMilestones += 1;
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
