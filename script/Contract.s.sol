// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "src/contracts/CheqRegistrar.sol";
import "src/test/mock/erc20.sol";
import "forge-std/console.sol";
import {CheqRegistrar} from "src/contracts/CheqRegistrar.sol";

contract ContractScript is Script {
    function setUp() public {}

    function run() public returns (CheqRegistrar) {

    uint256 deployerPrivateKey = vm.envUint("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    // address address1 = address(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266);
    // address address2 = address(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
    // address address3 = address(0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC);

    // vm.startBroadcast(address1);
    // // Deploy Cheq and ERC20s
    // ERC20 dai = new TestERC20(100e18, "dai", "DAI");
    // ERC20 usdc = new TestERC20(0, "usdc", "USDC");
    // CRX cheq = new CRX(); // trusted account cooldown seconds vm.parseJson("/", "");//
    // // vm.stopBroadcast();

    // // Complete handshake between three people
    // vm.broadcast(address1);
    // cheq.acceptAuditor(address3, true);
    // vm.broadcast(address2);
    // cheq.acceptAuditor(address3, true);

    // vm.broadcast(address3);
    // cheq.acceptUser(address1, true);
    // vm.broadcast(address3);
    // cheq.acceptUser(address2, true);
    // return cheq;
    }
}