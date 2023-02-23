// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";

library Events {
    // emit cheq structs or each variable?
    // event ModuleGlobalsGovernanceSet(
    //     address indexed prevGovernance,
    //     address indexed newGovernance,
    //     uint256 timestamp
    // );
    // event ModuleGlobalsTreasurySet(
    //     address indexed prevTreasury,
    //     address indexed newTreasury,
    //     uint256 timestamp
    // );
    // event ModuleGlobalsTreasuryFeeSet(
    //     uint16 indexed prevTreasuryFee,
    //     uint16 indexed newTreasuryFee,
    //     uint256 timestamp
    // );
    // // event FeeModuleBaseConstructed(address indexed moduleGlobals, uint256 timestamp);
    event ModuleBaseConstructed(address indexed registrar, uint256 timestamp);
    // Question: emit the module address or bytehash?
    event ModuleWhitelisted(
        address indexed user,
        address indexed module,
        bool isAccepted,
        bool isClonable,
        uint256 timestamp
    );
    event TokenWhitelisted(
        address caller,
        address indexed token,
        bool indexed accepted,
        uint256 timestamp
    );
    event RuleWhitelisted(
        address caller,
        address indexed rule,
        bool indexed accepted,
        uint256 timestamp
    );


    event Written(
        uint256 indexed cheqId,
        address indexed owner,
        uint256 directAmount,
        uint256 timestamp,
        address currency,
        uint256 amount,
        address drawer, 
        address recipient,
        address module,
        uint256 escrowed
    );

    // event Written(
    //     uint256 indexed cheqId,
    //     address indexed owner,
    //     DataTypes.Cheq indexed cheq,
    //     uint256 directAmount,
    //     bytes data,
    //     uint256 cheqFee,
    //     uint256 moduleFee,
    //     uint256 timestamp
    // );
    // Not used
    event Transferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to,
        uint256 cheqFee,
        uint256 moduleFee,
        uint256 timestamp
    );
    event Funded(
        address indexed funder,
        uint256 indexed cheqId,
        uint256 amount,
        uint256 directAmount,
        bytes indexed fundData,
        uint256 cheqFee,
        uint256 moduleFee,
        uint256 timestamp
    );
    event Cashed(
        address indexed casher,
        uint256 indexed cheqId,
        address to,
        uint256 amount,
        bytes indexed cashData,
        uint256 cheqFee,
        uint256 moduleFee,
        uint256 timestamp
    );
}
