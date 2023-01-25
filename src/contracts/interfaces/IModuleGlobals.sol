// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

interface IModuleGlobals {
    function setGovernance(address newGovernance) external;
    function setTreasury(address newTreasury) external;
    function setTreasuryFee(uint16 newTreasuryFee) external;
    function getGovernance() external view returns (address);
    function getTreasury() external view returns (address);
    function getTreasuryFee() external view returns (uint16);
    function getTreasuryData() external view returns (address, uint16);
}