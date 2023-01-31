// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";

// Question: Should the require statements be part of the interface? Would allow people to query canWrite(), canCash(), etc
interface ICheqModule {
    function processWrite(address caller, address owner, uint cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool, uint256);
    function processTransfer(address caller, address from, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory data) external returns (bool, address);
    function processFund(address caller, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool, uint256);
    function processCash(address caller, address to, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool, uint256);
    function processApproval(address caller, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory initData) external returns (bool, address);
    // function processOwnerOf(address owner, uint256 tokenId) external view returns(bool); // TODO settle on what this returns
    // function processBalanceOf() external view returns(uint256);
}