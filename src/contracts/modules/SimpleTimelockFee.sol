// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";

/**
 * @notice A simple time release module. The longer the release time, the more in fees you have to pay
 * Escrowed tokens are cashable after the releaseDate
 * Question: Allow cheq creator to update the URI?
 */
contract SimpleTimelockFee is ModuleBase {
    mapping(uint256 => uint256) public releaseDate;
    event Timelock(uint256 cheqId, uint256 _releaseDate);

    constructor(
        address registrar,
        DataTypes.WTFCFees memory _fees,
        string memory __baseURI
    ) ModuleBase(registrar, _fees) {
        _URI = __baseURI;
    }

    function processWrite(
        address, /*caller*/
        address, /*owner*/
        uint256 cheqId,
        address, /*currency*/
        uint256, /*escrowed*/
        uint256, /*instant*/
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        uint256 _releaseDate = abi.decode(initData, (uint256)); // Frontend uploads (encrypted) memo document and the URI is linked to cheqId here (URI and content hash are set as the same)
        releaseDate[cheqId] = _releaseDate;
        emit Timelock(cheqId, _releaseDate);
        return fees.writeBPS;
    }

    function processTransfer(
        address caller,
        address approved,
        address owner,
        address, /*from*/
        address, /*to*/
        uint256, /*cheqId*/
        address, /*currency*/
        uint256, /*escrowed*/
        uint256, /*createdAt*/
        bytes memory /*data*/
    ) external view override onlyRegistrar returns (uint256) {
        require(caller == owner || caller == approved, "Not owner or approved");
        return fees.transferBPS;
    }

    function processFund(
        address, /*caller*/
        address, /*owner*/
        uint256, /*amount*/
        uint256, /*instant*/
        uint256, /*cheqId*/
        DataTypes.Cheq calldata, /*cheq*/
        bytes calldata /*initData*/
    ) external view override onlyRegistrar returns (uint256) {
        require(false, "Only sending and cashing");
        return fees.fundBPS;
    }

    function processCash(
        address, /*caller*/
        address, /*owner*/
        address, /*to*/
        uint256 amount,
        uint256, /*cheqId*/
        DataTypes.Cheq calldata cheq,
        bytes calldata /*initData*/
    ) external view override onlyRegistrar returns (uint256) {
        require(amount == cheq.escrowed, "Must fully cash");
        return fees.cashBPS;
    }

    function processApproval(
        address caller,
        address owner,
        address, /*to*/
        uint256, /*cheqId*/
        DataTypes.Cheq calldata, /*cheq*/
        bytes memory /*initData*/
    ) external view override onlyRegistrar {
        require(caller == owner, "Only owner can approve");
    }

    function processTokenURI(uint256 tokenId)
        external
        view
        override
        returns (string memory)
    {
        return string(abi.encodePacked(_URI, tokenId));
    }
}