// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";

library Events {  // emit cheq structs or each variable?
    event ModuleGlobalsGovernanceSet(
        address indexed prevGovernance,
        address indexed newGovernance,
        uint256 timestamp
    );
    event ModuleGlobalsTreasurySet(
        address indexed prevTreasury,
        address indexed newTreasury,
        uint256 timestamp
    );
    event ModuleGlobalsTreasuryFeeSet(
        uint16 indexed prevTreasuryFee,
        uint16 indexed newTreasuryFee,
        uint256 timestamp
    );
    event FeeModuleBaseConstructed(address indexed moduleGlobals, uint256 timestamp);
    event ModuleBaseConstructed(address indexed registrar, uint256 timestamp);
    // TODO: emit the address of the module or the bytehash?
    event ModuleWhitelisted(
        address indexed user,
        address indexed module,
        bool isAccepted, 
        bool isClonable,
        uint256 timestamp
    );

    event Written(
        uint256 indexed cheqId,
        address indexed owner, 
        DataTypes.Cheq indexed cheq,
        bytes data, 
        uint256 timestamp
    );
    event Transferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 timestamp);
    event Funded(address indexed funder, uint256 indexed cheqId, bytes indexed fundData, uint256 timestamp);
    event Cashed(address indexed casher, address to, uint256 indexed cheqId, bytes indexed cashData, uint256 timestamp);
}