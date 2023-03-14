// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";

/**
 * @notice A simple payment module that includes an IPFS hash for memos (included in the URI)
 * Ownership grants the right to receive direct payment
 * Can be used to track: Promise of payment, Request for payment, Payment, or a Past payment (Payment & Invoice)
 * Essentially what Bulla and Request currently support
 */
contract DirectPay is ModuleBase {
    struct Payment {
        address creditor;
        address debtor;
        uint256 amount; // Face value of the payment
        uint256 timestamp; // Record keeping timestamp
        bool wasPaid; // TODO is this needed if using instant pay?
        string imageURI;
        string memoHash; // assumes ipfs://HASH
    }
    mapping(uint256 => Payment) public payInfo;

    event PaymentCreated(
        uint256 cheqId,
        string memoHash,
        uint256 amount,
        uint256 timestamp,
        address referer,
        address creditor,
        address debtor
    );
    error EscrowUnsupported();
    error AmountZero();
    error InvoiceWithPay();
    error InsufficientPayment();
    error AddressZero();
    error Disallowed();
    error OnlyOwner();
    error OnlyOwnerOrApproved();

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
    ) public override onlyRegistrar returns (uint256) {
        (
            address toNotify,
            uint256 amount, // Face value (for invoices)
            uint256 timestamp,
            address dappOperator,
            string memory imageURI,
            string memory memoHash
        ) = abi.decode(
                initData,
                (address, uint256, uint256, address, string, string)
            );
        if (escrowed != 0) revert EscrowUnsupported();
        if (amount == 0) revert AmountZero(); // Removing this would allow user to send memos

        if (caller == owner) // Invoice
        {
            if (instant != 0) revert InvoiceWithPay();
            payInfo[cheqId].creditor = caller;
            payInfo[cheqId].debtor = toNotify;
        } else if (owner == toNotify) // Payment
        {
            if (instant != amount) revert InsufficientPayment();
            if (owner == address(0)) revert AddressZero();
            payInfo[cheqId].creditor = toNotify;
            payInfo[cheqId].debtor = caller;
            payInfo[cheqId].wasPaid = true;
        } else {
            revert Disallowed();
        }

        payInfo[cheqId].amount = amount;
        payInfo[cheqId].timestamp = timestamp;
        payInfo[cheqId].memoHash = memoHash;
        payInfo[cheqId].imageURI = imageURI;

        uint256 moduleFee;
        {
            uint256 totalAmount = escrowed + instant;
            moduleFee = (totalAmount * fees.writeBPS) / BPS_MAX;
        }
        revenue[dappOperator][currency] += moduleFee;

        _logPaymentCreated(cheqId, memoHash, amount, timestamp, dappOperator);

        return moduleFee;
    }

    function _logPaymentCreated(
        uint256 cheqId,
        string memory memoHash,
        uint256 amount,
        uint256 timestamp,
        address referer
    ) private {
        emit PaymentCreated(
            cheqId,
            memoHash,
            amount,
            timestamp,
            referer,
            payInfo[cheqId].creditor,
            payInfo[cheqId].debtor
        );
    }

    function processTransfer(
        address caller,
        address approved,
        address owner,
        address /*from*/,
        address /*to*/,
        uint256 /*cheqId*/,
        address currency,
        uint256 escrowed,
        uint256 /*createdAt*/,
        bytes memory data
    ) public override onlyRegistrar returns (uint256) {
        if (caller != owner && caller != approved) revert OnlyOwnerOrApproved();
        uint256 moduleFee = (escrowed * fees.transferBPS) / BPS_MAX;
        revenue[abi.decode(data, (address))][currency] += moduleFee; // TODO who does this go to if no bytes? Set to CheqRegistrarOwner
        return moduleFee;
    }

    function processFund(
        address /*caller*/,
        address owner,
        uint256 amount,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) public override onlyRegistrar returns (uint256) {
        if (owner == address(0)) revert AddressZero();
        if (amount != 0) revert EscrowUnsupported();
        if (instant != payInfo[cheqId].amount) revert InsufficientPayment();
        if (payInfo[cheqId].wasPaid) revert Disallowed();
        // require(caller == payInfo[cheqId].debtor, "Only debtor"); // Should anyone be allowed to pay?
        payInfo[cheqId].wasPaid = true;

        uint256 moduleFee = ((amount + instant) * fees.fundBPS) / BPS_MAX;
        revenue[abi.decode(initData, (address))][cheq.currency] += moduleFee;
        return moduleFee;
    }

    function processCash(
        address /*caller*/,
        address /*owner*/,
        address /*to*/,
        uint256 /*amount*/,
        uint256 /*cheqId*/,
        DataTypes.Cheq calldata /*cheq*/,
        bytes calldata /*initData*/
    ) public view override onlyRegistrar returns (uint256) {
        revert Disallowed();
    }

    function processApproval(
        address caller,
        address owner,
        address /*to*/,
        uint256 /*cheqId*/,
        DataTypes.Cheq calldata /*cheq*/,
        bytes memory /*initData*/
    ) public view override onlyRegistrar {
        if (caller != owner) revert OnlyOwner();
        // require(wasPaid[cheqId], "Module: Must be cashed first");
    }

    function processTokenURI(
        uint256 tokenId
    ) external view override returns (string memory) {
        /**
            ',"external_url":', memoHash,
            ',"image":', imageHash
         */
        return
            string(
                abi.encodePacked(
                    ',"external_url":',
                    abi.encodePacked(_URI, payInfo[tokenId].memoHash),
                    ',"image":',
                    payInfo[tokenId].imageURI
                )
            );
    }
}
