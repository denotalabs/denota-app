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
// TODO could store rules as their own struct for simplicity
// Question allow module owners to change the Rules on the fly?
abstract contract ModuleBase is ICheqModule {
    address public immutable REGISTRAR; // Question: Make this a hardcoded address?

    string public _URI;
    mapping(address => mapping(address => uint256)) public revenue; // rewardAddress => token => rewardAmount
    uint256 internal constant BPS_MAX = 10_000; // Lens uses uint16
    address public writeRule;
    address public transferRule;
    address public fundRule;
    address public cashRule;
    address public approveRule; // Question can allow psuedo-operators (stored on module) to grant approvals
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
        REGISTRAR = registrar; // Question: Should this be before or after rule checking?

        require(
            ICheqRegistrar(REGISTRAR).rulesWhitelisted(
                _writeRule,
                _transferRule,
                _fundRule,
                _cashRule,
                _approveRule
            ),
            "RULES_INVALID"
        );
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
        uint256 cheqId,
        address currency,
        uint256 escrowed,
        uint256 instant,
        bytes calldata initData
    ) external virtual override onlyRegistrar returns (uint256) {
        // Fails here if not possible
        // IWriteRule(writeRule).canWrite(
        //     caller,
        //     owner,
        //     cheqId,
        //     currency,
        //     escrowed,
        //     instant,
        //     initData
        // );
        // Add module logic here
        return fees.writeBPS;
    }

    function processTransfer(
        address caller,
        address approved,
        address owner,
        address from,
        address to,
        uint256 cheqId,
        address currency,
        uint256 escrowed,
        uint256 createdAt,
        bytes calldata data
    ) external virtual override onlyRegistrar returns (uint256) {
        // ITransferRule(transferRule).canTransfer(
        //     caller,
        //     approved,
        //     owner,
        //     from,
        //     to,
        //     cheqId,
        //     cheq,
        //     data
        // ); // Checks if caller is ownerOrApproved
        // Add module logic here
        return fees.transferBPS;
    }

    function processFund(
        address caller,
        address owner,
        uint256 amount,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external virtual override onlyRegistrar returns (uint256) {
        IFundRule(fundRule).canFund(
            caller,
            owner,
            amount,
            instant,
            cheqId,
            cheq,
            initData
        );
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
        ICashRule(cashRule).canCash(
            caller,
            owner,
            to,
            amount,
            cheqId,
            cheq,
            initData
        );
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
    ) external virtual override onlyRegistrar {
        IApproveRule(approveRule).canApprove(
            caller,
            owner,
            to,
            cheqId,
            cheq,
            initData
        );
        // Add module logic here
    }

    function processTokenURI(uint256 tokenId)
        external
        view
        virtual
        override
        returns (string memory)
    {
        return string(abi.encodePacked(_URI, tokenId));
    }

    function getFees()
        external
        view
        virtual
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (fees.writeBPS, fees.transferBPS, fees.fundBPS, fees.cashBPS);
    }

    function withdrawFees(address token) public {
        // TODO do this using shares instead of absolute amounts (transfers can't specify referer)
        uint256 payoutAmount = revenue[msg.sender][token];
        require(payoutAmount > 1, "Insufficient revenue");
        revenue[msg.sender][token] = 1; // Should this be set to 1 wei? Saves on gas
        ICheqRegistrar(REGISTRAR).moduleWithdraw(
            token,
            payoutAmount - 1,
            msg.sender
        );
    }
}
