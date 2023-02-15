// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * @notice A simple payment module that includes an IPFS hash for memos included in the URI
 * Ownership grants the right to receive available escrow
 * Can be used to track: Promise of payment, Request for payment, Payment, or a Past payment
 * Depending on rules, only caller (payer) is allowed to release (to owner/recipient)
 */
contract SimpleMemo is ModuleBase {  // VenCashPal module
    mapping(uint256 => bytes32) public memo;  // How to turn this into an image that OpenSea can display? Might need to be encrypted
    mapping(uint256 => bool) public isCashed;
    // mapping(uint256 => bool) public isTransferable;  // Allow transferability here on write using bytes data decode
    string public _baseURI;

    event MemoWritten(uint256 indexed cheqId, bytes32 memoHash);

    constructor(
        address registrar,
        address _writeRule, 
        address _transferRule, 
        address _fundRule, 
        address _cashRule, 
        address _approveRule,
        DataTypes.WTFCFees memory _fees,
        string memory __baseURI
    ) ModuleBase(registrar, _writeRule, _transferRule, _fundRule, _cashRule, _approveRule, _fees) { // ERC721("SSTL", "SelfSignTimeLock") TODO: enumuration/registration of module features (like Lens?)
        _baseURI = __baseURI;
    }

    function processWrite(
        address caller,
        address owner,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bool isDirectPay,
        bytes calldata initData
    ) external override onlyRegistrar returns(uint256){ 
        IWriteRule(writeRule).canWrite(caller, owner, cheqId, cheq, isDirectPay, initData);

        bytes32 memoHash = abi.decode(initData, (bytes32));  // Frontend uploads (encrypted) memo document and the URI is linked to cheqId here (URI and content hash are set as the same)
        memo[cheqId] = memoHash;

        emit MemoWritten(cheqId, memoHash);
        
        return fees.writeBPS;
    }

    function processTransfer(  // QUESTION: allow transfer to anyone if cheq already cashed?
        address caller, 
        bool isApproved,
        address owner,
        address from,
        address to,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory data
    ) external override onlyRegistrar returns (uint256) {  // TODO need to pass approval status of the caller
        ITransferRule(transferRule).canTransfer(caller, isApproved, owner, from, to, cheqId, cheq, data);  // Checks if caller is ownerOrApproved
        return fees.transferBPS;
    }

    function processFund(
        address caller,
        address owner,
        uint256 amount,
        bool isDirectPay,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {  
        require(!isCashed[cheqId], "Module: Already cashed");
        IFundRule(fundRule).canFund(caller, owner, amount, isDirectPay, cheqId, cheq, initData);  
        return fees.fundBPS;
    }

    function processCash(
        address caller, 
        address owner,
        address to,
        uint256 amount, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        require(!isCashed[cheqId], "Module: Already cashed");
        ICashRule(cashRule).canCash(caller, owner, to, amount, cheqId, cheq, initData);
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
        require(isCashed[cheqId], "Module: Must be cashed first"); // Question: Should this be the case?
        IApproveRule(approveRule).canApprove(caller, owner, to, cheqId, cheq, initData);
    }    

    function processTokenURI(uint256 tokenId) external view override returns(string memory) {
        bytes32 memoHash = memo[tokenId];
        return string(abi.encodePacked(_baseURI, memoHash));  // ipfs://baseURU/memoHash --> memo // TODO encrypt upload on frontend
    }
}