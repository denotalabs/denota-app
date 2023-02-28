// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * @notice A simple payment module that includes an IPFS hash for memos (included in the URI)
 * Ownership grants the right to receive direct payment
 * Can be used to track: Promise of payment, Request for payment, Payment, or a Past payment (Invoice + Payment)

 Write: must
 */
// Both payment and invoicing
contract DirectPay is ModuleBase {
    struct Payment {
        address drawer;
        address recipient;
        uint256 amount; // Face value of the payment
        uint256 timestamp;
        bytes32 memoHash;
        bool wasPaid; // TODO is this needed if using instant pay?
    }
    mapping(uint256 => Payment) public payInfo;

    event PaymentCreated(
        uint256 cheqId,
        bytes32 memoHash,
        uint256 amount,
        uint256 timestamp,
        address referer
    );

    constructor(
        address registrar,
        address _writeRule,
        address _transferRule,
        address _fundRule,
        address _cashRule,
        address _approveRule,
        DataTypes.WTFCFees memory _fees,
        string memory __baseURI
    )
        ModuleBase(
            registrar,
            _writeRule,
            _transferRule,
            _fundRule,
            _cashRule,
            _approveRule,
            _fees
        )
    {
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
        /// TODO figure out how to know who paid and who is requesting?
        (
            address drawer,
            address recipient,
            uint256 amount,
            bytes32 memoHash,
            uint256 timestamp,
            address referer
        ) = abi.decode(
                initData,
                (address, address, uint256, bytes32, uint256, address)
            ); // Frontend uploads (encrypted) memo document and the URI is linked to cheqId here (URI and content hash are set as the same)
        require(escrowed == 0, "Rule: Escrowing not supported");
        require(amount != 0, "Rule: Amount == 0");
        require(
            instant == amount || instant == 0, // instant=0 is for invoicing
            "Rule: Must send full"
        );
        require(drawer != recipient, "Rule: Drawer == recipient");
        require(
            caller == drawer || caller == recipient,
            "Rule: Only drawer/receiver"
        );
        require(
            owner == drawer || owner == recipient,
            "Rule: Drawer/recipient != owner"
        );
        require(
            recipient != address(0) &&
                owner != address(0) &&
                drawer != address(0),
            "Rule: Can't use zero address"
        ); // TODO can be simplified

        payInfo[cheqId].amount = amount;
        payInfo[cheqId].memoHash = memoHash;
        payInfo[cheqId].timestamp = timestamp;

        uint256 moduleFee;
        {
            uint256 totalAmount = escrowed + instant;
            moduleFee = (totalAmount * fees.writeBPS) / BPS_MAX;
        }
        revenue[referer][currency] += moduleFee;

        emit PaymentCreated(cheqId, memoHash, amount, timestamp, referer);
        return moduleFee;
    }

    function processTransfer(
        address caller,
        address approved,
        address owner,
        address from,
        address to,
        uint256 cheqId,
        address currency,
        uint256 escrowed,
        uint256 createdAt,
        bytes memory data
    ) external override onlyRegistrar returns (uint256) {
        require(false, "Rule: Disallowed");
        // require(payInfo[cheqId].wasPaid, "Module: Only after cashing");
        uint256 moduleFee = (escrowed * fees.transferBPS) / BPS_MAX;
        // revenue[referer][cheq.currency] += moduleFee; // TODO who does this go to if no bytes? Set to CheqRegistrarOwner
        return moduleFee;
    }

    function processFund(
        address caller,
        address owner,
        uint256 amount,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        require(amount == 0, "Rule: Only direct pay");
        require(
            instant == payInfo[cheqId].amount,
            "Rule: Only full direct amount"
        );
        require(
            caller == payInfo[cheqId].recipient ||
                caller == payInfo[cheqId].drawer,
            "Rule: Only drawer/recipient"
        );
        require(caller != owner, "Rule: Not owner");
        require(!payInfo[cheqId].wasPaid, "Module: Already cashed");
        address referer = abi.decode(initData, (address));
        uint256 moduleFee = ((amount + instant) * fees.fundBPS) / BPS_MAX;
        revenue[referer][cheq.currency] += moduleFee;
        return moduleFee;
    }

    function processCash(
        address caller,
        address owner,
        address to,
        uint256 amount,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        require(false, "Rule: Disallowed");
        // address referer = abi.decode(initData, (address));
        // revenue[referer][cheq.currency] += moduleFee;
        // payInfo[cheqId].wasPaid = true;
        uint256 moduleFee = (amount * fees.cashBPS) / BPS_MAX;
        return moduleFee;
    }

    function processApproval(
        address caller,
        address owner,
        address to,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes memory initData
    ) external override onlyRegistrar {
        IApproveRule(approveRule).canApprove(
            caller,
            owner,
            to,
            cheqId,
            cheq,
            initData
        );
        // require(wasPaid[cheqId], "Module: Must be cashed first");
    }
}
