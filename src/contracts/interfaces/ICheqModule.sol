// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";

interface ICheqModule {
    function processWrite(address caller, address owner, uint cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool);
    function processTransfer(address caller, address from, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory data) external returns (bool);
    function processFund(address caller, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool);
    function processCash(address caller, address to, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool);
    function processApproval(address caller, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory initData) external returns (bool);
}