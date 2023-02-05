// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;

import "openzeppelin/token/ERC20/IERC20.sol";
import { AxelarExecutable } from "axelarnetwork/executable/AxelarExecutable.sol";
import { IAxelarGateway } from "axelarnetwork/interfaces/IAxelarGateway.sol";
import { IAxelarGasService } from "axelarnetwork/interfaces/IAxelarGasService.sol";
import "../contracts/CheqRegistrar.sol";

contract CheqBridge is AxelarExecutable {
    string public value;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasReceiver;
    CheqRegistrar public cheq;

    constructor(address gateway_, address gasReceiver_, CheqRegistrar _cheq) AxelarExecutable(gateway_) {
        gasReceiver = IAxelarGasService(gasReceiver_);
        cheq = _cheq;
    }

    // Writing, funding: initiated from ETH, coins custodied on ETH, NFT minted/updated on Polygon 
    /* 
      cashing: 

      Option 1: Cash out on ETH, send state update to Polygon 
         How do if we know if a Cheq is cashable? We need an oracle (would be complicated)
      
      Option 2: ETH sends state update to Polygon, Polygon checks status and send request back to ETH
         Would be two ETH transactions and 1 Polygon transactions
         2nd ETH transaction could be composable USDC
    */

    /* 
      Alternative axelar implementation:

      "Cash and bridge": Automatically swap to another chain when cashing 
        Would still require the user having gas on Polygon, but would save bridging

    */

    function createRemoteCheq(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata value_
    ) external payable {
        bytes memory payload = abi.encode(value_);
        if (msg.value > 0) {
            gasReceiver.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function _execute(
        string calldata sourceChain_,
        string calldata sourceAddress_,
        bytes calldata payload_
    ) internal override {
        (value) = abi.decode(payload_, (string));
        sourceChain = sourceChain_;
        sourceAddress = sourceAddress_;
    }
}