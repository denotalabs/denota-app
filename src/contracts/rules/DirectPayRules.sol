// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

contract DirectPayRules is
    IWriteRule,
    ITransferRule,
    IFundRule,
    ICashRule,
    IApproveRule
{
    function canWrite(
        address caller,
        address owner,
        uint256, /*cheqId*/
        DataTypes.Cheq calldata cheq,
        uint256 directAmount,
        bytes calldata /*initData*/
    ) external pure {
        require(cheq.escrowed == 0, "Rule: Escrowing not supported");
        require(cheq.amount != 0, "Rule: Amount == 0");
        require(
            directAmount == cheq.amount || directAmount == 0, // directAmount=0 is for invoicing
            "Rule: Must send full"
        );
        require(cheq.drawer != cheq.recipient, "Rule: Drawer == recipient");
        require(
            caller == cheq.drawer || caller == cheq.recipient,
            "Rule: Only drawer/receiver"
        );
        require(
            owner == cheq.drawer || owner == cheq.recipient,
            "Rule: Drawer/recipient != owner"
        );
        require(
            cheq.recipient != address(0) &&
                owner != address(0) &&
                cheq.drawer != address(0),
            "Rule: Can't use zero address"
        ); // TODO can be simplified
    }

    function canTransfer(
        address caller,
        bool isApproved,
        address owner,
        address, /*from*/
        address to,
        uint256, /*cheqId*/
        DataTypes.Cheq calldata cheq,
        bytes memory /*initData*/
    ) external pure {
        require(false, "Rule: Disallowed");
    }

    function canFund(
        address caller,
        address owner,
        uint256 amount,
        uint256 directAmount,
        uint256, /*cheqId*/
        DataTypes.Cheq calldata cheq,
        bytes calldata /*initData*/
    ) external pure {
        require(amount == 0, "Rule: Only direct pay");
        require(directAmount == cheq.amount, "Rule: Only full direct amount");
        require(
            caller == cheq.recipient || caller == cheq.drawer,
            "Rule: Only drawer/recipient"
        );
        require(caller != owner, "Rule: Not owner");
    }

    function canCash(
        address caller,
        address owner,
        address, /*to*/
        uint256 amount,
        uint256, /*cheqId*/
        DataTypes.Cheq calldata cheq,
        bytes calldata /*initData*/
    ) external pure {
        require(false, "Rule: Disallowed");
    }

    function canApprove(
        address, /*caller*/
        address, /*owner*/
        address, /*to*/
        uint256, /*cheqId*/
        DataTypes.Cheq calldata, /*cheq*/
        bytes calldata /*initData*/
    ) external pure {
        require(false, "Rule: Disallowed");
    }
}
