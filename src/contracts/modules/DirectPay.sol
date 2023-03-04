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
        address payee;
        address payer;
        uint256 amount; // Face value of the payment
        uint256 timestamp; // Relevant timestamp
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
        require(escrowed == 0, "Escrowing not supported");
        (
            address toNotify,
            uint256 amount,
            uint256 timestamp,
            address dappOperator,
            bytes32 memoHash
        ) = abi.decode(initData, (address, uint256, uint256, address, bytes32));
        // caller, owner, recipient
        require(amount != 0, "Amount == 0");
        require(
            instant == amount || instant == 0, // instant=0 is for invoicing
            "Must send full"
        );
        if (caller == owner) {
            payInfo[cheqId].payee = caller;
            payInfo[cheqId].payer = toNotify;
        } else {
            require(instant == amount, "No payment");
            payInfo[cheqId].payee = toNotify;
            payInfo[cheqId].payer = caller;
            payInfo[cheqId].wasPaid = true;
        }
        payInfo[cheqId].amount = amount;
        payInfo[cheqId].timestamp = timestamp;
        payInfo[cheqId].memoHash = memoHash;
        // require(drawer != recipient, "Rule: Drawer == recipient");
        require(
            owner == caller || owner == toNotify,
            "Drawer/recipient != owner"
        );
        require(toNotify != address(0) && owner != address(0), "Zero address"); // TODO can be simplified

        uint256 moduleFee;
        {
            uint256 totalAmount = escrowed + instant;
            moduleFee = (totalAmount * fees.writeBPS) / BPS_MAX;
        }
        revenue[dappOperator][currency] += moduleFee;

        emit PaymentCreated(cheqId, memoHash, amount, timestamp, dappOperator);
        return moduleFee;
    }

    function processTransfer(
        address caller,
        address approved,
        address owner,
        address, /*from*/
        address, /*to*/
        uint256, /*cheqId*/
        address currency,
        uint256 escrowed,
        uint256, /*createdAt*/
        bytes memory data
    ) public override onlyRegistrar returns (uint256) {
        require(
            caller == owner || caller == approved,
            "Only owner or approved"
        );

        // require(payInfo[cheqId].wasPaid, "Module: Only after cashing");
        uint256 moduleFee = (escrowed * fees.transferBPS) / BPS_MAX;
        revenue[abi.decode(data, (address))][currency] += moduleFee; // TODO who does this go to if no bytes? Set to CheqRegistrarOwner
        return moduleFee;
    }

    function processFund(
        address caller,
        address, /*owner*/
        uint256 amount,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) public override onlyRegistrar returns (uint256) {
        require(amount == 0, "Only direct pay");
        // require(caller != owner, "Owner doesn't fund");
        require(caller == payInfo[cheqId].payer, "Only drawer/recipient");
        require(!payInfo[cheqId].wasPaid, "Module: Already cashed");
        require(instant == payInfo[cheqId].amount, "Only full direct amount");
        payInfo[cheqId].wasPaid = true;
        uint256 moduleFee = ((amount + instant) * fees.fundBPS) / BPS_MAX;
        revenue[abi.decode(initData, (address))][cheq.currency] += moduleFee;
        return moduleFee;
    }

    function processCash(
        address, /*caller*/
        address, /*owner*/
        address, /*to*/
        uint256, /*amount*/
        uint256, /*cheqId*/
        DataTypes.Cheq calldata, /*cheq*/
        bytes calldata /*initData*/
    ) public view override onlyRegistrar returns (uint256) {
        require(false, "Rule: Disallowed");
        // address referer = abi.decode(initData, (address));
        // payInfo[cheqId].wasPaid = true;
        // uint256 moduleFee = (amount * fees.cashBPS) / BPS_MAX;
        // revenue[referer][cheq.currency] += moduleFee;
        return 0;
    }

    function processApproval(
        address, /*caller*/
        address, /*owner*/
        address, /*to*/
        uint256, /*cheqId*/
        DataTypes.Cheq calldata, /*cheq*/
        bytes memory /*initData*/
    ) public view override onlyRegistrar {
        require(false, "Rule: Disallowed");
        // require(wasPaid[cheqId], "Module: Must be cashed first");
    }

    function processTokenURI(uint256 tokenId)
        external
        view
        override
        returns (string memory)
    {
        return string(abi.encodePacked(_URI, payInfo[tokenId].memoHash));
    }
}
