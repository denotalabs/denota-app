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
 * 1) Milestone payment is created
    a) if the caller is the owner, it is an invoice.
    b) if the caller isn't the owner, it is a payment.
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
            address dappOperator,
            bytes32 docHash,
            uint256[] memory milestonePrices
        ) = abi.decode(initData, (address, bytes32, uint256[]));
        uint256 totalMilestones = milestonePrices.length;
        require(totalMilestones > 1, "Module: Insufficient milestones"); // First milestone is upfront payment

        invoices[cheqId].totalMilestones = totalMilestones;
        invoices[cheqId].documentHash = docHash;

        if (caller == owner) {
            // Invoice
            invoices[cheqId].worker = caller;
            invoices[cheqId].client = owner;
        } else {
            // Payment
            invoices[cheqId].worker = owner;
            invoices[cheqId].client = caller;
            invoices[cheqId].startTime = block.timestamp;
            // If first milestone is not escrowed, make sure it is paid
            if (escrowed != milestonePrices[0]) {
                require(
                    instant == milestonePrices[0],
                    "Pay/escrow 1st milestone amount"
                );
                invoices[cheqId].currentMilestone += 1;
            }
        }

        for (uint256 i = 0; i < totalMilestones; i++) {
            milestones[cheqId].push(
                Milestone({amount: milestonePrices[i], isCashed: false})
            );
        }
        uint256 moduleFee = ((escrowed + instant) * fees.fundBPS) / BPS_MAX;
        revenue[dappOperator][currency] += moduleFee;
        return moduleFee;
    }

    function processTransfer(
        address, /*caller*/
        address, /*approved*/
        address, /*owner*/
        address, /*from*/
        address, /*to*/
        uint256, /*cheqId*/
        address, /*currency*/
        uint256, /*escrowed*/
        uint256, /*createdAt*/
        bytes memory /*data*/
    ) external view override onlyRegistrar returns (uint256) {
        require(false, "Non-transferable");
        return 0;
    }

    function processFund(
        /// Should instant be allowed here instead of escrow?
        address, /*caller*/
        address, /*owner*/
        uint256 amount,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        // require(caller != owner, "Not owner");  // Prob not necessary
        invoices[cheqId].currentMilestone += 1;
        require(
            amount ==
                milestones[cheqId][invoices[cheqId].currentMilestone].amount,
            "Must fully fund milestone"
        );
        if (invoices[cheqId].startTime == 0)
            invoices[cheqId].startTime = block.timestamp; // If first milestone
        ICheqRegistrar(REGISTRAR).cash( // Where the worker should be paid Question: does this work?
            cheqId,
            amount,
            invoices[cheqId].worker,
            bytes("")
        );

        uint256 moduleFee = ((amount + instant) * fees.fundBPS) / BPS_MAX;
        revenue[abi.decode(initData, (address))][cheq.currency] += moduleFee;
        return moduleFee;
    }

    // Allow the funder or owner to cash the current milestone
    function processCash(
        address, /*caller*/
        address owner,
        address to,
        uint256 amount,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        require(
            to == owner || to == invoices[cheqId].client,
            "Only worker/client"
        );
        require(
            amount ==
                milestones[cheqId][invoices[cheqId].currentMilestone].amount,
            "Not milestone amount"
        );
        invoices[cheqId].currentMilestone += 1;
        uint256 moduleFee = ((amount) * fees.fundBPS) / BPS_MAX;
        revenue[abi.decode(initData, (address))][cheq.currency] += moduleFee;
        return moduleFee;
    }

    function processApproval(
        address, /*caller*/
        address, /*owner*/
        address, /*to*/
        uint256, /*cheqId*/
        DataTypes.Cheq calldata, /*cheq*/
        bytes memory /*initDat*/
    ) external view override onlyRegistrar {
        require(false, "");
    }

    // function processOwnerOf(address owner, uint256 tokenId) external view returns(bool) {}

    function processTokenURI(uint256 tokenId)
        public
        view
        override
        onlyRegistrar
        returns (string memory)
    {
        string memory __baseURI = _baseURI();
        return
            bytes(__baseURI).length > 0
                ? string(abi.encodePacked(_URI, tokenId))
                : "";
    }

    /*//////////////////////////////////////////////////////////////
                            Module Functions
    //////////////////////////////////////////////////////////////*/
    function _baseURI() internal view returns (string memory) {
        return _URI;
    }

    // function setBaseURI(string calldata __baseURI) external onlyOwner {
    //     _URI = __baseURI;
    // }

    function getMilestones(uint256 cheqId)
        public
        view
        returns (Milestone[] memory)
    {
        return milestones[cheqId];
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
