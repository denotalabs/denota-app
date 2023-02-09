pragma solidity >=0.8.14;

import "openzeppelin/token/ERC20/IERC20.sol";
import {AxelarExecutable} from "axelarnetwork/executable/AxelarExecutable.sol";
import {IAxelarGateway} from "axelarnetwork/interfaces/IAxelarGateway.sol";
import {IAxelarGasService} from "axelarnetwork/interfaces/IAxelarGasService.sol";
import "../contracts/CheqRegistrar.sol";

contract CheqBridgeReceiver is AxelarExecutable {
    string public value;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasReceiver;
    CheqRegistrar public cheq;

    constructor(
        address gateway_,
        address gasReceiver_,
        CheqRegistrar _cheq
    ) AxelarExecutable(gateway_) {
        gasReceiver = IAxelarGasService(gasReceiver_);
        cheq = _cheq;
    }

    function _execute(
        string calldata sourceChain_,
        string calldata sourceAddress_,
        bytes calldata payload_
    ) internal override {
        (
            bool _isInvoice,
            string memory _uriToken,
            IERC20 _token,
            uint256 amount,
            address recipient
        ) = abi.decode(payload_, (bool, string, IERC20, uint256, address));
        if (_isInvoice) {
            // write invoice
        } else {
            // write cheq
        }
    }
}
