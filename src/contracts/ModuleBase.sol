// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import {Errors} from "../contracts/libraries/Errors.sol";
import {Events} from "../contracts/libraries/Events.sol";
import {DataTypes} from "../contracts/libraries/DataTypes.sol";
import {ICheqModule} from "../contracts/interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../contracts/interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../contracts/interfaces/IWTFCRules.sol";

abstract contract ModuleBase is Ownable, ICheqModule {
    address public immutable REGISTRAR;  // Question: Make this a hardcoded address?
    address public writeRule;
    address public transferRule;
    address public fundRule;
    address public cashRule;
    address public approveRule;

    modifier onlyRegistrar() {
        if (msg.sender != REGISTRAR) revert Errors.NotRegistrar();
        _;
    }
    constructor(
        address registrar,
        address _writeRule, 
        address _transferRule, 
        address _fundRule, 
        address _cashRule, 
        address _approveRule) {
        if (registrar == address(0)) revert Errors.InitParamsInvalid();

        REGISTRAR = registrar;  // Question: Should this be before or after rule checking?

        require(ICheqRegistrar(REGISTRAR).rulesWhitelisted(
            _writeRule,
            _transferRule,
            _fundRule,
            _cashRule,
            _approveRule), "RULES_INVALID");
        writeRule = _writeRule;
        transferRule = _transferRule;
        fundRule = _fundRule;
        cashRule = _cashRule;
        approveRule = _approveRule;

        emit Events.ModuleBaseConstructed(registrar, block.timestamp);
    }

    function processWrite(
        address caller,
        address owner,
        uint cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external virtual override onlyRegistrar returns(bool, uint256, DataTypes.Cheq memory){ 
        bool isWriteable = IWriteRule(writeRule).canWrite(caller, owner, cheqId, cheq, initData);
        uint256 moduleFee = 0;
        DataTypes.Cheq memory adjCheq = cheq;
        return (isWriteable, moduleFee, adjCheq);
    }

    function processTransfer(  // Question: should module be allowed to take fee here?
        address caller, 
        address owner,
        address from,
        address to,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory data
    ) external virtual  override onlyRegistrar returns (bool, address) {
        bool isTransferable = ITransferRule(transferRule).canTransfer(caller, owner, from, to, cheqId, cheq, data);  // Checks if caller is ownerOrApproved
        return (isTransferable, to);
    }

    function processFund(
        address caller,
        address owner,
        uint256 amount,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external virtual  override onlyRegistrar returns (bool, uint256, uint256) {  
        bool isFundable = IFundRule(fundRule).canFund(caller, owner, amount, cheqId, cheq, initData);  
        uint256 moduleFee = 0;
        return (isFundable, moduleFee, amount);
    }

    function processCash( 
        address caller, 
        address owner,
        address to,
        uint256 amount, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external virtual  override onlyRegistrar returns (bool, uint256, uint256) {
        bool isCashable = ICashRule(cashRule).canCash(caller, owner, to, amount, cheqId, cheq, initData);
        uint256 moduleFee = 0;
        return (isCashable, moduleFee, amount);
    }

    function processApproval(
        address caller, 
        address owner,
        address to, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory initData
    ) external virtual  override onlyRegistrar returns (bool, address){
        bool isApprovable = IApproveRule(approveRule).canApprove(caller, owner, to, cheqId, cheq, initData);
        return (isApprovable, to);
    }
    
    function withdrawFees(address token, uint256 amount, address payoutAccount) public onlyOwner {
        ICheqRegistrar(REGISTRAR).moduleWithdraw(token, amount, payoutAccount);
    }
}