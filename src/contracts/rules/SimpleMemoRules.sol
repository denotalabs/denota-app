// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

// TODO add these to the Errors.sol as reverts
contract SimpleMemoRules is IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule {

    function canWrite(
        address caller, 
        address owner, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata cheq, 
        bool /*isDirectPay*/,
        bytes calldata /*initData*/
    ) external pure {
        require((cheq.amount != 0), "Rule: Amount == 0");
        require((cheq.drawer != cheq.recipient), "Rule: Drawer == recipient"); 
        require((owner == cheq.drawer || owner == cheq.recipient), "Rule: Drawer or recipient aren't owner"); 
        require((caller == cheq.drawer || caller == cheq.recipient), "Rule: Only drawer/receiver"); 
        require((cheq.escrowed == 0 || cheq.escrowed == cheq.amount), "Rule: Semi funding disallowed"); 
        require((cheq.recipient != address(0) && owner != address(0) && cheq.drawer != address(0)), "Rule: Can't use zero address"); 
        // return (
        //        (cheq.amount != 0) &&  // Cheq must have a face value
        //        (cheq.drawer != cheq.recipient) && // Drawer and recipient aren't the same
        //        (owner == cheq.drawer || owner == cheq.recipient) &&  // Either drawer or recipient must be owner
        //        (caller == cheq.drawer || caller == cheq.recipient) &&  // Delegated pay/requesting not allowed
        //        (cheq.escrowed == 0 || cheq.escrowed == cheq.amount) &&  // Either send unfunded or fully funded cheq
        //        (cheq.recipient != address(0) && owner != address(0) && cheq.drawer != address(0)))  // Can't send to zero address
   }

    function canTransfer(
        address caller, 
        bool isApproved,
        address owner, 
        address /*from*/, 
        address to, uint256 /*cheqId*/, 
        DataTypes.Cheq calldata cheq, 
        bytes memory /*initData*/
    ) external pure { 
        require(caller == owner || isApproved, "Rule: NotApprovedOrOwner");
        require((to == cheq.recipient || to == cheq.drawer), "Rule: Only recipient or drawer"); // onlyOwnerOrApproved can transfer and only to/from drawer/recipient TODO approved var part missing
    }

    function canFund(  // Only the recipient can cash
        address caller, 
        address /*owner*/, 
        uint256 amount, 
        bool /*isDirectPay*/, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata /*initData*/
    ) external pure { 
        require(caller == cheq.recipient, "Rule: Only recipient");
        require(amount == cheq.amount, "Rule: Must fund in full");
        require(cheq.escrowed == 0, "Rule: Can only fund invoices");
    }

    function canCash(
        address caller, 
        address owner, 
        address /*to*/, 
        uint256 amount, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata /*initData*/
    ) external pure { 
        require(caller == owner, "Rule: Only owner");
        require(amount == cheq.escrowed, "Rule: Must cash in full");
    }

    function canApprove(
        address /*caller*/, 
        address /*owner*/, 
        address /*to*/, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata /*cheq*/, 
        bytes calldata /*initData*/
    ) external pure {}
}
