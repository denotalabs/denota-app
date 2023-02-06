// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * @notice A simple payment module that includes an IPFS hash for memos included in the URI
 * Ownership grants the right to cash available escrow
 * Can be used to track: Promise of payment, Request for payment, Payment, Past payment
 */
contract SimpleMemo is ModuleBase {  // VenCashPal module
    mapping(uint256 => bytes32) public memo;  // How to turn this into an image that OpenSea can display? Might need to be encrypted
    mapping(uint256 => bool) public isCashed;
    string public _baseURI;

    constructor(
        address registrar,
        address _writeRule, 
        address _transferRule, 
        address _fundRule, 
        address _cashRule, 
        address _approveRule,
        string memory __baseURI
        ) ModuleBase(registrar, _writeRule, _transferRule, _fundRule, _cashRule, _approveRule) {
        _baseURI = __baseURI;
    }

    function processWrite(
        address caller,
        address owner,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns(bool, uint256, DataTypes.Cheq memory){ 
        bool isWriteable = IWriteRule(writeRule).canWrite(caller, owner, cheqId, cheq, initData);
        if (!isWriteable) return (isWriteable, 0, cheq);
        bytes32 memoHash = abi.decode(initData, (bytes32));  // Frontend uploads (encrypted) memo document and the URI is linked to cheqId here (URI and content hash are set as the same)
        memo[cheqId] = memoHash;
        return (isWriteable, 0, cheq);
    }

    function processTransfer(  // QUESTION: allow transfer to anyone if cheq already cashed?
        address caller, 
        address owner,
        address from,
        address to,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory data
    ) external override onlyRegistrar returns (bool, address) {  // TODO need to pass approval status of the caller
        bool isTransferable = ITransferRule(transferRule).canTransfer(caller, owner, from, to, cheqId, cheq, data);  // Checks if caller is ownerOrApproved
        return (isTransferable, to);
    }

    function processFund(
        address caller,
        address owner,
        uint256 amount,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external override onlyRegistrar returns (bool, uint256, uint256) {  
        require(!isCashed[cheqId], "Already cashed");  // How to abstract this?
        bool isFundable = IFundRule(fundRule).canFund(caller, owner, amount, cheqId, cheq, initData);  
        return (isFundable, 0, cheq.amount); // NOTE: forces caller to fund total amount
    }

    function processCash(
        address caller, 
        address owner,
        address to,
        uint256 amount, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external override onlyRegistrar returns (bool, uint256, uint256) {
        require(!isCashed[cheqId], "Already cashed");
        bool isCashable = ICashRule(cashRule).canCash(caller, owner, to, amount, cheqId, cheq, initData);
        if (!isCashable) return (isCashable, 0, 0);  // Don't set as cashed if cashing disallowed
        isCashed[cheqId] = true;
        return (isCashable, 0, cheq.escrowed);
    }

    function processApproval(
        address caller, 
        address owner,
        address to, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory initData
    ) external override onlyRegistrar returns (bool, address){
        require(isCashed[cheqId], "Approvals not supported until cashed"); // Question: Should this be the case?
        bool isApprovable = IApproveRule(approveRule).canApprove(caller, owner, to, cheqId, cheq, initData);  // Question: use AllTrueRule?
        return (isApprovable, to);
    }    

    function processTokenURI(uint256 tokenId) external view returns(string memory) {
        bytes32 memoHash = memo[tokenId];
        return string(abi.encodePacked(_baseURI, memoHash));  // ipfs://baseURU/memoHash --> memo // TODO encrypt upload on frontend
    }
}