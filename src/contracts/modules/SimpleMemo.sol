// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * A simple payment module that includes an IPFS hash for memos
 * Ownership grants the right to cash available escrow
 * Can be used to pay or request pay
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

    // Ownership determines who is debted and who is credited. Drawer/recipient is based on who created the cheq
    // Invoice1: drawer==caller==owner and recipient should pay
    // Invoice2: drawer==caller!=owner and drawer should pay (wouldn't make sense though? Why would the creator write themself an invoice?)
    // Should payer create an unfunded invoice for themselves (they created their debit)
    function processWrite(
        address caller,
        address owner,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns(bool, uint256, DataTypes.Cheq memory){ 
        // require(cheq.amount != 0, "Valueless cheq");
        // require(cheq.drawer != cheq.recipient, "Drawer and recipient are the same");
        // require(owner == cheq.drawer || owner == cheq.recipient , "Either drawer or recipient must be owner");
        // require(caller == cheq.drawer || caller == cheq.recipient, "Delegated pay/requesting not allowed");
        // require(cheq.escrow == 0 || cheq.escrowed == cheq.amount);
        bool isWriteable = IWriteRule(writeRule).canWrite(caller, owner, cheqId, cheq, initData);
        bytes32 memoHash = abi.decode(initData, (bytes32));  // Frontend uploads (encrypted) memo document and the URI is linked to cheqId here (URI and content hash are set as the same)
        memo[cheqId] = memoHash;
        return (isWriteable, 0, cheq);
    }

    function processTransfer(
        address caller, 
        address owner,
        address from,
        address to,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory data
    ) external override onlyRegistrar returns (bool, address) {  // TODO need to pass approval status of the caller
        // require(caller == owner && (to == cheq.recipient || to == cheq.drawer), "onlyOwnerOrApproved can transfer and only to/from drawer/recipient");  // Can only send back and forth if desired
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
        // require(caller != owner, "Owner's cheq is a recievable not payable");
        // require(cheq.escrow == 0 , "Can only fund invoices");
        // require(!isCashed[cheqId], "Already cashed");
        // require(amount == cheq.amount, "Must fund in full");
        // require(caller == cheq.drawer || caller == cheq.recipient, "Non participating party");  // Question: Should this be a requirement?
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
        // require(caller == owner, "Only owner can cash");
        bool isCashable = ICashRule(cashRule).canCash(caller, owner, to, amount, cheqId, cheq, initData);
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
        // require(isCashed[cheqId], "Approvals not supported") // Question: Should this be the case?
        bool isApprovable = IApproveRule(approveRule).canApprove(caller, owner, to, cheqId, cheq, initData);  // Question: true in all cases?
        return (isApprovable, to);
    }    

    function processTokenURI(uint256 tokenId) external view returns(string memory) {
        bytes32 memoHash = memo[tokenId];
        return string(abi.encodePacked(_baseURI, memoHash));  // ipfs://baseURU/memoHash --> memo // TODO encrypt upload on frontend
    }
}