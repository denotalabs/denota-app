// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {DataTypes} from "../libraries/DataTypes.sol";

// Question: Not sure if theres a way to use libraries for this instead of contracts
// TODO: add function supportsInterface() for each of these functions such that a contract can make sure contracts have them
interface IWriteRule { function canWrite(address caller, address owner, uint cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns(bool); }
interface ITransferRule { function canTransfer(address caller, address from, address to, uint256 cheqId,  DataTypes.Cheq calldata cheq, bytes memory initData) external returns(bool); }
interface IFundRule { function canFund(address caller, uint256 amount, uint256 cheqId,  DataTypes.Cheq calldata cheq,  bytes calldata initData) external returns(bool); }
interface ICashRule { function canCash(address caller, address to, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns(bool); }
interface IApproveRule { function canApprove(address caller, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns(bool); }
