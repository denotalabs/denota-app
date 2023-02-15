// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import {Errors} from "../contracts/libraries/Errors.sol";
import {Events} from "../contracts/libraries/Events.sol";
import {DataTypes} from "../contracts/libraries/DataTypes.sol";
import {ICheqModule} from "../contracts/interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../contracts/interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../contracts/interfaces/IWTFCRules.sol";

// TODO separate fee and non-fee modules (perhaps URI distinction ones as well?)
// Question allow module owners to change the Rules on the fly?
// TODO could store rules as their own struct for simplicity
abstract contract ModuleBase is Ownable, ICheqModule {
    address public immutable REGISTRAR;  // Question: Make this a hardcoded address?
    mapping(address => mapping(address => uint256)) revenue;  // rewardAddress => token => rewardAmount
    uint256 internal constant BPS_MAX = 10_000;  // Lens uses uint16
    address public writeRule;
    address public transferRule;
    address public fundRule;
    address public cashRule;
    address public approveRule;  // Question can allow psuedo-operators (stored on module) to grant approvals
    DataTypes.WTFCFees public fees;

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
        address _approveRule,
        DataTypes.WTFCFees memory _fees
        ) { 
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
        require(_fees.writeBPS < BPS_MAX, "Module: Fee too high");
        require(_fees.transferBPS < BPS_MAX, "Module: Fee too high");
        require(_fees.fundBPS < BPS_MAX, "Module: Fee too high");
        require(_fees.cashBPS < BPS_MAX, "Module: Fee too high");
        fees = _fees;

        emit Events.ModuleBaseConstructed(registrar, block.timestamp);
    }

    function processWrite(
        address caller,
        address owner,
        uint cheqId,
        DataTypes.Cheq calldata cheq,
        bool isDirectPay, 
        bytes calldata initData
    ) external virtual override onlyRegistrar returns(uint256){  // Fails here if not possible
        IWriteRule(writeRule).canWrite(caller, owner, cheqId, cheq, isDirectPay, initData);
        // Add module logic here
        return fees.writeBPS;
    }

    function processTransfer( 
        address caller, 
        bool isApproved,
        address owner,
        address from,
        address to,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata data
    ) external virtual override onlyRegistrar returns (uint256) {
        ITransferRule(transferRule).canTransfer(caller, isApproved, owner, from, to, cheqId, cheq, data);  // Checks if caller is ownerOrApproved
        // Add module logic here
        return fees.transferBPS;
    }

    function processFund(
        address caller,
        address owner,
        uint256 amount,
        bool isDirectPay,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external virtual override onlyRegistrar returns (uint256) {  
        IFundRule(fundRule).canFund(caller, owner, amount, isDirectPay, cheqId, cheq, initData);  
        // Add module logic here
        return fees.fundBPS;
    }

    function processCash( 
        address caller, 
        address owner,
        address to,
        uint256 amount, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external virtual override onlyRegistrar returns (uint256) {
        ICashRule(cashRule).canCash(caller, owner, to, amount, cheqId, cheq, initData);
        // Add module logic here
        return fees.cashBPS;
    }

    function processApproval(
        address caller, 
        address owner,
        address to, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory initData
    ) external virtual override onlyRegistrar{
        IApproveRule(approveRule).canApprove(caller, owner, to, cheqId, cheq, initData);
        // Add module logic here
    }

    function processTokenURI(uint256 /*tokenId*/) external virtual view returns(string memory) {
        return "";
    }
    
    function getFees() external virtual view returns(uint256, uint256, uint256, uint256) {
        return (fees.writeBPS, fees.transferBPS, fees.fundBPS, fees.cashBPS);
    }

    function withdrawFees(address token) public {
        uint256 payoutAmount = revenue[_msgSender()][token];
        require(payoutAmount > 1, "Insufficient revenue");
        revenue[_msgSender()][token] = 1;  // Should this be set to 1 wei? Saves on gas
        ICheqRegistrar(REGISTRAR).moduleWithdraw(token, payoutAmount - 1, _msgSender());
    }
}