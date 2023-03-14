// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import {Errors} from "../contracts/libraries/Errors.sol";
import {Events} from "../contracts/libraries/Events.sol";
import {DataTypes} from "../contracts/libraries/DataTypes.sol";
import {ICheqModule} from "../contracts/interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../contracts/interfaces/ICheqRegistrar.sol";
import {IRegistrarGov} from "../contracts/interfaces/IRegistrarGov.sol";

// TODO separate fee and non-fee modules (perhaps URI distinction ones as well?)
// HACK: if the module doesn't check for address(0), users can cash and fund zero init cheqs
// ERC-4906: EIP-721 Metadata Update Extension
abstract contract ModuleBase is ICheqModule {
    address public immutable REGISTRAR; // Question: Make this a hardcoded address?
    mapping(address => mapping(address => uint256)) public revenue; // rewardAddress => token => rewardAmount
    mapping(address => DataTypes.WTFCFees) public dappOperatorFees;
    uint256 internal constant BPS_MAX = 10_000; // Lens uses uint16
    string public _URI; // Should this be in the ModuleBase?
    error FeeTooHigh();
    /**
return takeReturnFee(currency, escrowed + instant, dappOperator);
return takeReturnFee(currency, escrowed, abi.decode(data, (address)));
return
            takeReturnFee(
                cheq.currency,
                amount,
                abi.decode(initData, (address))
            );
*/

    modifier onlyRegistrar() {
        if (msg.sender != REGISTRAR) revert Errors.NotRegistrar();
        _;
    }

    constructor(address registrar, DataTypes.WTFCFees memory _fees) {
        if (registrar == address(0)) revert Errors.InitParamsInvalid();
        REGISTRAR = registrar; // Question: Should this be before or after rule checking?

        if (BPS_MAX < _fees.writeBPS) revert FeeTooHigh();
        if (BPS_MAX < _fees.transferBPS) revert FeeTooHigh();
        if (BPS_MAX < _fees.fundBPS) revert FeeTooHigh();
        if (BPS_MAX < _fees.cashBPS) revert FeeTooHigh();

        dappOperatorFees[msg.sender] = _fees;

        emit Events.ModuleBaseConstructed(registrar, block.timestamp);
    }

    function setFees(DataTypes.WTFCFees memory _fees) public {
        dappOperatorFees[msg.sender] = _fees;
    }

    function takeReturnFee(
        address currency,
        uint256 amount,
        address dappOperator,
        uint8 _WTFC
    ) internal returns (uint256 fee) {
        if (_WTFC == 0) {
            fee = dappOperatorFees[dappOperator].writeBPS;
        } else if (_WTFC == 1) {
            fee = dappOperatorFees[dappOperator].transferBPS;
        } else if (_WTFC == 2) {
            fee = dappOperatorFees[dappOperator].fundBPS;
        } else if (_WTFC == 3) {
            fee = dappOperatorFees[dappOperator].cashBPS;
        } else {
            revert("");
        }
        // TODO ensure this doesn't overflow
        fee = (amount * fee) / BPS_MAX;
        revenue[dappOperator][currency] += fee;
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

    // function processTokenURI(
    //     uint256 tokenId
    // ) external view virtual override returns (string memory) {
    //     return string(abi.encodePacked(_URI, tokenId));
    // }

    function getFees(
        address dappOperator
    ) public view virtual returns (DataTypes.WTFCFees memory) {
        return dappOperatorFees[dappOperator];
    }

    function withdrawFees(address token) public {
        // TODO do this using shares instead of absolute amounts (transfers can't specify referer)
        uint256 payoutAmount = revenue[msg.sender][token];
        require(payoutAmount > 1, "Insufficient revenue");
        revenue[msg.sender][token] = 1; // Should this be set to 1 wei? Saves on gas
        IRegistrarGov(REGISTRAR).moduleWithdraw(
            token,
            payoutAmount - 1,
            msg.sender
        );
    }
}
