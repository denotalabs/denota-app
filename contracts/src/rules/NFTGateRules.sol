// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/utils/introspection/IERC165.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * @notice Contract that modules can use to gate their WTFC functionalities by whether the caller is a NFT holder
 */
// contract NFTGatingRules is
//     IWriteRule,
//     ITransferRule,
//     IFundRule,
//     ICashRule,
//     IApproveRule
// {
//     /** @dev the module calling these functions must provide the NFT address as bytes
//      * @param caller the account trying to write the cheq
//      * @param initData the address in the form of a bytes array
//      */
//     function _ownsToken(address caller, bytes memory initData)
//         internal
//         view
//         returns (bool)
//     {
//         // The module passes which token contract it wants to use for its gating rules
//         address nftContract = abi.decode(initData, (address));
//         return ERC721(nftContract).balanceOf(caller) > 0;
//     }

//     function canWrite(
//         address caller,
//         address, /*owner*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         uint256, /*directAmount*/
//         bytes calldata initData
//     ) external view {
//         require(_ownsToken(caller, initData), "WriteRule: Not token owner");
//     }

//     function canTransfer(
//         address caller,
//         address approved,
//         address, /*owner*/
//         address, /*from*/
//         address, /*to*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes memory initData
//     ) external view {
//         require(_ownsToken(caller, initData), "WriteRule: Not token owner");
//     }

//     function canFund(
//         address caller,
//         address, /*owner*/
//         uint256, /*amount*/
//         uint256, /*directAmount*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata initData
//     ) external view {
//         require(_ownsToken(caller, initData), "WriteRule: Not token owner");
//     }

//     function canCash(
//         address caller,
//         address, /*owner*/
//         address, /*to*/
//         uint256, /*amount*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata initData
//     ) external view {
//         require(_ownsToken(caller, initData), "WriteRule: Not token owner");
//     }

//     function canApprove(
//         address caller,
//         address, /*owner*/
//         address, /*to*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata initData
//     ) external view {
//         require(_ownsToken(caller, initData), "WriteRule: Not token owner");
//     }
// }
