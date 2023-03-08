// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

// contract AllTrueRules is
//     IWriteRule,
//     ITransferRule,
//     IFundRule,
//     ICashRule,
//     IApproveRule
// {
//     function canWrite(
//         address, /*caller*/
//         address, /*owner*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         uint256, /*directAmount*/
//         bytes calldata /*initData*/
//     ) external pure {}

//     function canTransfer(
//         address, /*caller*/
//         address, /*approved*/
//         address, /*owner*/
//         address, /*from*/
//         address, /*to*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes memory /*initData*/
//     ) external pure {}

//     function canFund(
//         address, /*caller*/
//         address, /*owner*/
//         uint256, /*amount*/
//         uint256, /*directAmount*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata /*initData*/
//     ) external pure {}

//     function canCash(
//         address, /*caller*/
//         address, /*owner*/
//         address, /*to*/
//         uint256, /*amount*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata /*initData*/
//     ) external pure {}

//     function canApprove(
//         address, /*caller*/
//         address, /*owner*/
//         address, /*to*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata /*initData*/
//     ) external pure {}
// }
