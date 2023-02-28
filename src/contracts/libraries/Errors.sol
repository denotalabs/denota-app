// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

library Errors {
    error NotWhitelisted();
    error TokenNotWhitelisted();
    error ModuleNotWhitelisted();
    error NotRegistrar();
    // error NotGovernance();

    // // Module Errors
    error ModuleParamsInvalid();
    error InitParamsInvalid();

    // Cheq Errors
    error CheqInvalid();
    error ZeroAddress();
    error ZeroEscrow();

    // MultiState Errors
    error Paused();
    error WritingPaused();
    error TransferringPaused();
    error FundingPaused();
    error CashingPaused();
    error ApprovingPaused();
    error BurningPaused();

    // error CannotInitImplementation();
    // error Initialized();
    // error SignatureExpired();
    // error ZeroSpender();
    // error SignatureInvalid();
    // error NotOwnerOrApproved();
    // error TokenDoesNotExist();
    // error NotGovernanceOrEmergencyAdmin();
    // error EmergencyAdminCannotUnpause();
    // error NotDispatcher();
    // error BlockNumberInvalid();
    // error ArrayMismatch();
    // error InvalidParameter();
}
