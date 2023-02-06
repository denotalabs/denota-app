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
        if (cheq.amount == 0) { // Valueless cheq
            return false;
        } else if (cheq.drawer == cheq.recipient) {  // Drawer and recipient are the same
            return false;
        } else if (owner != cheq.drawer && owner != cheq.recipient) {  // Either drawer or recipient must be owner
            return false;
        } else if (caller != cheq.drawer && caller != cheq.recipient) {  // Delegated pay/requesting not allowed
            return false;
        } else if (cheq.escrowed != 0 && cheq.escrowed != cheq.amount) {  // Either send unfunded or fully funded cheq
            return false;
        } else if (cheq.recipient == address(0) || owner == address(0)) {  // Can't send to zero address
            return false;
        }
        return true; // NOTE could return the final elif clause but slightly less clear
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
        if (caller == owner) {  // Owner's cheq is a recievable not payable
            return false;
        } else if (cheq.escrowed != 0) {  // Can only fund invoices
            return false;
        } else if (amount != cheq.amount) {  // Must fund in full
            return false;
        } else if (caller != cheq.drawer && caller != cheq.recipient) {  // Non-participating party // Question: Should this be a requirement?
            return false;
        }
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
        if (caller != owner) {  // Only owner can cash
            return false;
        } else if (amount != cheq.escrowed) {  // Must fully cash escrowed amount
            return false;
        } else if (cheq.escrowed != cheq.amount) {  // Must be fully funded
            return false;
        }
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
