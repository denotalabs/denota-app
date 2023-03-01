// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";

/**
 * @notice A simple time release module
 * Escrowed tokens are cashable after the releaseDate
 */
contract SimpleTimelock is ModuleBase {
    mapping(uint256 => bool) public isCashed;
    mapping(uint256 => uint256) public releaseDate;

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
        // require(cheq.escrowed == cheq.amount, "");

        uint256 _releaseDate = abi.decode(initData, (uint256)); // Frontend uploads (encrypted) memo document and the URI is linked to cheqId here (URI and content hash are set as the same)
        releaseDate[cheqId] = _releaseDate;
        // Need event
        return fees.writeBPS;
    }

    function processTransfer(
        address, /*caller*/
        address, /*approved*/
        address, /*owner*/
        address, /*from*/
        address, /*to*/
        uint256 cheqId,
        address, /*currency*/
        uint256, /*escrowed*/
        uint256, /*createdAt*/
        bytes memory /*data*/
    ) external view override onlyRegistrar returns (uint256) {
        // TODO need to pass approval status of the caller
        require(isCashed[cheqId], "Needs full funding");
        // Checks if caller is ownerOrApproved
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
    ) external override onlyRegistrar returns (uint256) {
        require(!isCashed[cheqId], "Already cashed"); // How to abstract this?
        // require(endDate[cheqId] <= block.timestamp, "Funding over");
        // require(cheq.escrowed + amount <= cheq.amount, "Overfunding");
        // uint256 fundAmount = cheq.escrowed + amount <= cheq.amount ? amount : cheq.amount - cheq.escrowed;
        return fees.fundBPS;
    }

    function processCash(
        address, /*caller*/
        address, /*owner*/
        address, /*to*/
        uint256 amount,
        uint256 cheqId,
        DataTypes.Cheq calldata, /*cheq*/
        bytes calldata /*initData*/
    ) external override onlyRegistrar returns (uint256) {
        require(!isCashed[cheqId], "Already cashed");
        // require(cheq.escrowed == cheq.amount, "");
        isCashed[cheqId] = true;
        return fees.cashBPS;
    }

    function processApproval(
        address caller,
        address owner,
        address to,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes memory initData
    ) external override onlyRegistrar {
        require(isCashed[cheqId], "Must be cashed first");
    }

    // TODO
    function processTokenURI(uint256 tokenId)
        external
        view
        override
        returns (string memory)
    {
        // Allow cheq creator to update the URI?
        uint256 _releaseDate = releaseDate[tokenId];
        return string(abi.encodePacked(_URI, _releaseDate)); // ipfs://baseURU/memoHash --> memo // TODO encrypt upload on frontend
    }
}
