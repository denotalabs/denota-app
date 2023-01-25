// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {Errors} from "../contracts/libraries/Errors.sol";
import {Events} from "../contracts/libraries/Events.sol";

abstract contract ModuleBase {
    address public immutable REGISTRAR;

    modifier onlyRegistrar() {
        if (msg.sender != REGISTRAR) revert Errors.NotRegistrar();
        _;
    }
    constructor(address registrar) {
        if (registrar == address(0)) revert Errors.InitParamsInvalid();
        REGISTRAR = registrar;
        emit Events.ModuleBaseConstructed(registrar, block.timestamp);
    }
}