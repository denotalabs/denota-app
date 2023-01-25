// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

contract AllTrueRules is IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule { // Each rule the module uses can use different contracts or the point to the same ones
    function canWrite(address /*caller*/, address /*owner*/, uint /*cheqId*/, DataTypes.Cheq calldata /*cheq*/, bytes calldata /*initData*/) external pure returns(bool) { return true; }
    function canTransfer(address /*caller*/,  address /*from*/, address /*to*/, uint256 /*cheqId*/, DataTypes.Cheq calldata /*cheq*/, bytes memory /*initData*/) external pure returns(bool) { return true; }
    function canFund() external pure returns(bool) { return true; }
    function canCash() external pure returns(bool) { return true; }
    function canApprove() external pure returns(bool) { return true; }
}
