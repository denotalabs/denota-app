// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC721/ERC721.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * @notice Contract that modules can use to gate their WTFC functionalities by whether the caller is a NFT holder
 */
contract NFTGatingRules is IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule {

    /** @dev the module calling these functions must provide the NFT address as bytes 
     * @param caller the account trying to write the cheq
     * @param initData the address in the form of a bytes array
     */
    function _ownsToken(address caller, bytes memory initData) internal view returns(bool) {
         // The module passes which token contract it wants to use for its gating rules
        address nftContract = abi.decode(initData, (address)); 
        return ERC721(nftContract).balanceOf(caller) > 0;
    }

    function canWrite(
        address caller, 
        address /*owner*/,
        uint /*cheqId*/,
        DataTypes.Cheq calldata /*cheq*/,
        bytes calldata initData
    ) external view returns(bool) { 
        return _ownsToken(caller, initData);
    }

    function canTransfer(
        address caller, 
        address /*from*/, 
        address /*owner*/,
        address /*to*/, 
        uint256 /*cheqId*/,
        DataTypes.Cheq calldata /*cheq*/, 
        bytes memory initData
    ) external view returns(bool) { 
        return _ownsToken(caller, initData); 
    }

    function canFund(  // Question: Should these be uint instead of bool?
        address caller, 
        address /*owner*/,
        uint256 /*amount*/, 
        uint256 /*cheqId*/,  
        DataTypes.Cheq calldata /*cheq*/,  
        bytes calldata initData
    ) external view returns(bool) { 
        return _ownsToken(caller, initData);
    }

    function canCash(  // Question: Should these be uint instead of bool?
        address caller, 
        address /*owner*/,
        address /*to*/, 
        uint256 /*amount*/, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata /*cheq*/, 
        bytes calldata initData
    ) external view returns(bool) { 
        return _ownsToken(caller, initData);
    }

    function canApprove(
        address caller, 
        address /*owner*/,
        address /*to*/, 
        uint256 /*cheqId*/, 
        DataTypes.Cheq calldata /*cheq*/, 
        bytes calldata initData
    ) external view returns(bool) { 
        return _ownsToken(caller, initData);
    }
}