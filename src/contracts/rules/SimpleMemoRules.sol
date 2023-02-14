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
    ) external pure { 
        require(
            (cheq.amount != 0) &&  // Cheq must have a face value
            (cheq.drawer != cheq.recipient) && // Drawer and recipient aren't the same
            (owner == cheq.drawer || owner == cheq.recipient) &&  // Either drawer or recipient must be owner
            (caller == cheq.drawer || caller == cheq.recipient) &&  // Delegated pay/requesting not allowed
            (cheq.escrowed == 0 || cheq.escrowed == cheq.amount) &&  // Either send unfunded or fully funded cheq
            (cheq.recipient != address(0) && owner != address(0))  // Can't send to zero address
        , ""); // TODO should each of these be a different require?
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
        require((caller == owner || isApproved) && (to == cheq.recipient || to == cheq.drawer), ""); // onlyOwnerOrApproved can transfer and only to/from drawer/recipient TODO approved var part missing
    }

    function canFund(
        address caller, 
        address owner, 
        uint256 amount, 
        uint256 /*cheqId*/,  
        DataTypes.Cheq calldata cheq,  
        bytes calldata /*initData*/
    ) external pure { 
        // Owner's cheq is a recievable not payable
        require(caller == owner, "");
        // Can only fund invoices
        require(cheq.escrowed != 0, "");
        // Must fund in full
        require(amount != cheq.amount, "");
        // Non-participating party
        require((caller != cheq.drawer && caller != cheq.recipient), "");
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
        // Only owner can cash
        require(caller != owner, "");
        // Must fully cash escrowed amount
        require(amount != cheq.escrowed, "");
        // Must be fully funded
        require(cheq.escrowed != cheq.amount, "");
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
