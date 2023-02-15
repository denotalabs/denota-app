// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

contract AllFalseRules is IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule { // Each rule the module uses can use different contracts or the point to the same ones
    function canWrite(address /*caller*/, address /*owner*/, uint256 /*cheqId*/, DataTypes.Cheq calldata /*cheq*/, bool /*isInstant*/, bytes calldata /*initData*/) external pure { revert("WriteRule: Disallowed"); }
    function canTransfer(address /*caller*/, bool /*isApproved*/, address /*owner*/, address /*from*/, address /*to*/, uint256 /*cheqId*/, DataTypes.Cheq calldata /*cheq*/, bytes memory /*initData*/) external pure { revert("TransferRule: Disallowed"); }
    function canFund(address /*caller*/, address /*owner*/, uint256 /*amount*/, bool /*isDirectPay*/, uint256 /*cheqId*/,  DataTypes.Cheq calldata /*cheq*/,  bytes calldata /*initData*/) external pure { revert("FundRule: Disallowed"); }
    function canCash(address /*caller*/, address /*owner*/, address /*to*/, uint256 /*amount*/, uint256 /*cheqId*/, DataTypes.Cheq calldata /*cheq*/, bytes calldata /*initData*/) external pure { revert("CashRule: Disallowed"); }
    function canApprove(address /*caller*/, address /*owner*/, address /*to*/, uint256 /*cheqId*/, DataTypes.Cheq calldata /*cheq*/, bytes calldata /*initData*/) external pure { revert("ApproveRule: Disallowed"); }
}
