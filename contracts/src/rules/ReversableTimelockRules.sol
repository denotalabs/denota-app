// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

// contract ReversableTimelockRules is
//     IWriteRule,
//     ITransferRule,
//     IFundRule,
//     ICashRule,
//     IApproveRule
// {
//     function canWrite(
//         address caller,
//         address owner,
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata cheq,
//         uint256 instant,
//         bytes calldata /*initData*/
//     ) external pure {
//         require(instant == 0, "Rule: Only escrows");
//         require((cheq.amount != 0), "Rule: Amount == 0");
//         require((cheq.drawer != cheq.recipient), "Rule: Drawer == recipient");
//         require(
//             (caller == cheq.drawer || caller == cheq.recipient),
//             "Rule: Only drawer/receiver"
//         );

//         require(
//             (cheq.escrowed == 0 || cheq.escrowed == cheq.amount),
//             "Rule: Semi funding disallowed"
//         );
//         require(
//             (owner == cheq.drawer || owner == cheq.recipient),
//             "Rule: Drawer/recipient != owner"
//         );
//         require(
//             (cheq.recipient != address(0) &&
//                 owner != address(0) &&
//                 cheq.drawer != address(0)),
//             "Rule: Can't use zero address"
//         );
//         // require(
//         //     instant == 0 || (owner == cheq.recipient),  // Question: could allow someone to pay some up front and rest in reversable escrow
//         //     "Rule: Only owner can be sent"
//         // );
//     }

//     function canTransfer(
//         address caller,
//         bool isApproved,
//         address owner,
//         address, /*from*/
//         address to,
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata cheq,
//         bytes memory /*initData*/
//     ) external pure {
//         require(caller == owner || isApproved, "Rule: NotApprovedOrOwner");
//         require(
//             (to == cheq.recipient || to == cheq.drawer),
//             "Rule: Only recipient or drawer"
//         ); // onlyOwnerOrApproved can transfer and only to/from drawer/recipient TODO approved var part missing
//     }

//     function canFund(
//         // Only the recipient can cash
//         address caller,
//         address, /*owner*/
//         uint256 amount,
//         uint256, /*instant*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata cheq,
//         bytes calldata /*initData*/
//     ) external pure {
//         require(caller == cheq.recipient, "Rule: Only recipient");
//         require(amount == cheq.amount, "Rule: Must fund in full");
//         require(cheq.escrowed == 0, "Rule: Can only fund invoices");
//     }

//     function canCash(
//         address caller,
//         address owner,
//         address, /*to*/
//         uint256 amount,
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata cheq,
//         bytes calldata /*initData*/
//     ) external pure {
//         require(caller == owner, "Rule: Only owner");
//         require(amount == cheq.escrowed, "Rule: Must cash in full");
//     }

//     function canApprove(
//         address, /*caller*/
//         address, /*owner*/
//         address, /*to*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata /*initData*/
//     ) external pure {}
// }
