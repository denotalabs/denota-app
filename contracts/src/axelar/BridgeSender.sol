// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;

import "openzeppelin/token/ERC20/IERC20.sol";
import {AxelarExecutable} from "axelarnetwork/executable/AxelarExecutable.sol";
import {IAxelarGateway} from "axelarnetwork/interfaces/IAxelarGateway.sol";
import {IAxelarGasService} from "axelarnetwork/interfaces/IAxelarGasService.sol";
import "../CheqRegistrar.sol";

contract CheqBridgeSender is AxelarExecutable {
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

    function createRemoteCheq(
        IERC20 _token,
        uint256 amount,
        address recipient,
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata uriToken_
    ) external payable {
        require(_token.transfer(recipient, amount), "Transfer failed");
        bytes memory payload = abi.encode(
            true,
            uriToken_,
            _token,
            amount,
            recipient
        );
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{value: msg.value}(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function createRemoteInvoice(
        IERC20 _token,
        uint256 amount,
        address recipient,
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata uriToken_
    ) external payable {
        bytes memory payload = abi.encode(
            false,
            uriToken_,
            _token,
            amount,
            recipient
        );
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{value: msg.value}(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationAddress, payload);
    }
}