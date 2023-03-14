// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";

/**
 * Note: Only payments, allows sender to choose when to release and whether to reverse (assuming it's not released yet)
 */
contract ReversableRelease is ModuleBase {
    struct Payment {
        address inspector;
        address drawer;
        bytes32 memoHash;
    }
    mapping(uint256 => Payment) public payInfo;

    constructor(
        address registrar,
        DataTypes.WTFCFees memory _fees,
        string memory __baseURI
    ) ModuleBase(registrar, _fees) {
        _URI = __baseURI;
    }

    function processWrite(
        address caller,
        address owner,
        uint256 cheqId,
        address currency,
        uint256 escrowed,
        uint256 instant,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        (address inspector, address dappOperator, bytes32 memoHash) = abi
            .decode(initData, (address, address, bytes32));
        require((caller != owner) && (owner != address(0)), "Invalid Params");

        payInfo[cheqId].inspector = inspector;
        payInfo[cheqId].drawer = caller;
        payInfo[cheqId].memoHash = memoHash;

        return takeReturnFee(currency, escrowed + instant, dappOperator, 0);
    }

    function processTransfer(
        address caller,
        address approved,
        address owner,
        address /*from*/,
        address /*to*/,
        uint256 /*cheqId*/,
        address currency,
        uint256 escrowed,
        uint256 /*createdAt*/,
        bytes memory data
    ) external override onlyRegistrar returns (uint256) {
        require(
            caller == owner || caller == approved,
            "Only owner or approved"
        );
        return
            takeReturnFee(currency, escrowed, abi.decode(data, (address)), 1);
    }

    function processFund(
        address, // caller,
        address, // owner,
        uint256, // amount,
        uint256, // instant,
        uint256, // cheqId,
        DataTypes.Cheq calldata, // cheq,
        bytes calldata // initData
    ) external view override onlyRegistrar returns (uint256) {
        require(false, "");
        return 0;
    }

    function processCash(
        address caller,
        address /*owner*/,
        address /*to*/,
        uint256 amount,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        require(
            caller == payInfo[cheqId].inspector,
            "Inspector cash for owner"
        );
        return
            takeReturnFee(
                cheq.currency,
                amount,
                abi.decode(initData, (address)),
                3
            );
    }

    function processApproval(
        address caller,
        address owner,
        address to,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes memory initData
    ) external override onlyRegistrar {}

    function processTokenURI(
        uint256 /*tokenId*/
    ) external pure override returns (string memory) {
        return "";
    }
}
