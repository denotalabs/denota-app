// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import "openzeppelin/security/Pausable.sol";
import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";

abstract contract SimpleAdmin is Pausable, ModuleBase {}
