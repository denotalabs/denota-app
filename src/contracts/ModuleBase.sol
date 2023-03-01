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
    DataTypes.WTFCFees public fees;

    modifier onlyRegistrar() {
        if (msg.sender != REGISTRAR) revert Errors.NotRegistrar();
        _;
    }

    constructor(address registrar, DataTypes.WTFCFees memory _fees) {
        if (registrar == address(0)) revert Errors.InitParamsInvalid();
        REGISTRAR = registrar; // Question: Should this be before or after rule checking?

        require(_fees.writeBPS < BPS_MAX, "Module: Fee too high");
        require(_fees.transferBPS < BPS_MAX, "Module: Fee too high");
        require(_fees.fundBPS < BPS_MAX, "Module: Fee too high");
        require(_fees.cashBPS < BPS_MAX, "Module: Fee too high");
        fees = _fees;

        emit Events.ModuleBaseConstructed(registrar, block.timestamp);
    }

    // function processWrite(
    //     address caller,
    //     address owner,
    //     uint256 cheqId,
    //     address currency,
    //     uint256 escrowed,
    //     uint256 instant,
    //     bytes calldata initData
    // ) external virtual override onlyRegistrar returns (uint256) {
    //     // Add module logic here
    //     return fees.writeBPS;
    // }

    // function processTransfer(
    //     address caller,
    //     address approved,
    //     address owner,
    //     address from,
    //     address to,
    //     uint256 cheqId,
    //     address currency,
    //     uint256 escrowed,
    //     uint256 createdAt,
    //     bytes calldata data
    // ) external virtual override onlyRegistrar returns (uint256) {
    //     // Add module logic here
    //     return fees.transferBPS;
    // }

    // function processFund(
    //     address caller,
    //     address owner,
    //     uint256 amount,
    //     uint256 instant,
    //     uint256 cheqId,
    //     DataTypes.Cheq calldata cheq,
    //     bytes calldata initData
    // ) external virtual override onlyRegistrar returns (uint256) {
    //     // Add module logic here
    //     return fees.fundBPS;
    // }

    // function processCash(
    //     address caller,
    //     address owner,
    //     address to,
    //     uint256 amount,
    //     uint256 cheqId,
    //     DataTypes.Cheq calldata cheq,
    //     bytes calldata initData
    // ) external virtual override onlyRegistrar returns (uint256) {
    //     // Add module logic here
    //     return fees.cashBPS;
    // }

    // function processApproval(
    //     address caller,
    //     address owner,
    //     address to,
    //     uint256 cheqId,
    //     DataTypes.Cheq calldata cheq,
    //     bytes memory initData
    // ) external virtual override onlyRegistrar {
    //     // Add module logic here
    // }

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
