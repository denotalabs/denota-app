// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

contract SimpleMemoRules is IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule {

    function canWrite(
        address caller, 
        address owner, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata /*initData*/
    ) external pure returns(bool) { 
        // Valueless cheq
        if (cheq.amount == 0) return false;
        // Drawer and recipient are the same
        if (cheq.drawer == cheq.recipient) return false;
        // Either drawer or recipient must be owner
        if (owner != cheq.drawer && owner != cheq.recipient) return false;
        // Delegated pay/requesting not allowed
        if (caller != cheq.drawer && caller != cheq.recipient) return false;
        // Either send unfunded or fully funded cheq
        if (cheq.escrowed != 0 && cheq.escrowed != cheq.amount) return false;
        // Can't send to zero address
        if (cheq.recipient == address(0) || owner == address(0)) return false;

        return true; // NOTE could return the final if clause but slightly less clear
    }

    function canTransfer(
        address caller, 
        address owner, 
        address /*from*/, 
        address to, uint256 /*cheqId*/, 
        DataTypes.Cheq calldata cheq, 
        bytes memory /*initData*/
    ) external pure returns(bool) { 
        return caller == owner && (to == cheq.recipient || to == cheq.drawer); // onlyOwnerOrApproved can transfer and only to/from drawer/recipient TODO approved var part missing
    }

    function canFund(
        address caller, 
        address owner, 
        uint256 amount, 
        uint256 /*cheqId*/,  
        DataTypes.Cheq calldata cheq,  
        bytes calldata /*initData*/
    ) external pure returns(bool) { 
        // Owner's cheq is a recievable not payable
        if (caller == owner) return false;
        // Can only fund invoices
        if (cheq.escrowed != 0) return false;
        // Must fund in full
        if (amount != cheq.amount) return false;
        // Non-participating party // Question: Should this be a requirement?
        if (caller != cheq.drawer && caller != cheq.recipient) return false;

        return true; 
    }

    function canCash(
        address caller, 
        address owner, 
        address /*to*/, 
        uint256 amount, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata /*initData*/
    ) external pure returns(bool) { 
        // Only owner can cash
        if (caller != owner) return false;
        // Must fully cash escrowed amount
        if (amount != cheq.escrowed) return false;
        // Must be fully funded
        if (cheq.escrowed != cheq.amount) return false;
        
        return true; 
    }

    function canApprove(
        address /*caller*/, 
        address /*owner*/, 
        address /*to*/, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata /*cheq*/, 
        bytes calldata /*initData*/
    ) external pure returns(bool) { 
        return true; 
    }
}
