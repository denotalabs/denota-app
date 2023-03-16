// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {DataTypes} from "../libraries/DataTypes.sol";

// Question: Should these return bool or revert? Returning bool allows front-ends to determine if a cheq is valid before calling
// Question: Not sure if theres a way to use libraries for this instead of contracts
// TODO need to have a way of validating bytesdata (QUESTION could args be zero-initialized if missing in bytes??)
// TODO: add function supportsInterface() for each of these functions such that a contract can make sure contracts have them
// Each rule a module uses can use different contracts or the point to the same ones
// Each rule is a restriction. Every ruleset should be strictly safer than AllTrue no?
interface IWriteRule {
    function canWrite(
        address caller,
        address owner,
        uint256 cheqId,
        address currency,
        uint256 escrowed,
        uint256 instant,
        bytes calldata initData
    ) external;
}

interface ITransferRule {
    function canTransfer(
        address caller,
        address approved,
        address owner,
        address from,
        address to,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes memory initData
    ) external;
}

interface IFundRule {
    function canFund(
        address caller,
        address owner,
        uint256 amount,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external;
}

interface ICashRule {
    function canCash(
        address caller,
        address owner,
        address to,
        uint256 amount,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external;
}

// Question: how should approve rules interact with transfer?
interface IApproveRule {
    function canApprove(
        address caller,
        address owner,
        address to,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external;
}

/**
Non-rule rules:
    canX: 
        true
        false

// NOTE any combination of these following rules within a given WTFC should be valid
Universal Rules:
    canX:
        caller ==,!= owner
        caller ==,!= cheq.drawer
        caller ==,!= cheq.recipient

Argument-derived Rules:
    canWrite specific:
       owner ==,!= cheq.drawer
       owner ==,!= cheq.recipient
       cheq.drawer ==,!= cheq.recipient
       cheq.amount ==,!=,>,>= cheq.escrowed
    canTransfer specific:
        caller ==,!= from
        caller ==,!= to
        owner ==,!= to
        owner ==,!= from
        to ==,!= cheq.drawer
        from ==,!= cheq.drawer
        to ==,!= cheq.recipient
        from ==,!= cheq.recipient
    canFund specific:
        amount ==,!=,<,>,>=,<= cheq.escrowed
        cheq.escrowed + amount ==,<=,< cheq.amount
    canCash specific:
        caller ==,!= to
        to ==,!= cheq.drawer
        to ==,!= cheq.recipient
        to ==,!= owner

Universal Contract Storage + Argument-derived Rules:
    (!)addressBool[caller]
    (!)uintBool[cheqId]

Contract Storage + Argument-derived Rules:
    canWrite:
       (!)addressBool[currency]
       (!)addressBool[cheq.recipient]
       (!)addressBool[cheq.drawer]
       (!)addressBool[owner]
       owner != address(CONST)
       cheq.drawer != address(CONST)
       cheq.recipient != address(CONST)
       cheq.escrowed ==,!=,<,>,>=,<= CONST
       cheq.escrowed + CONST ==,!=,<,>,>=,<= cheq.amount
       cheq.amount ==,!=,<,>,>=,<= CONST
       cheq.mintTimestamp ==,!=,<,>,>=,<= CONST 
       cheqId ==,!=,<,>,>=,<= CONST
       (cheqId +-*%/<<>> CONST) ==,!=,<,>,>=,<= CONST
    canTransfer:
        (!)addressBool[to]
        (!)addressBool[from]
        to ==,!= address(CONST)
        from ==,!= address(CONST)
        to ==,!= from
    canFund:
        amount ==,!=,<,>,>=,<= CONST
    canCash:
        (!)addressBool[to]
        to ==,!= address(CONST)
        amount ==,!=,<,>,>=,<= CONST

Contract Storage + bytes-argument-derived rules:
    canWrite:
    canTransfer:
    canFund:
    canCash:
 */
