// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/utils/Strings.sol";
import "openzeppelin/access/Ownable.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC721/ERC721.sol";
import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";


contract HandshakeTimeLock is ModuleBase, ICheqModule {

    mapping(address => mapping(address => bool)) public userAuditor; // Whether User accepts Auditor
    mapping(address => mapping(address => bool)) public auditorUser; // Whether Auditor accepts User
//     // mapping(address => mapping(address => address)) public acceptedCombos;  // Whether this combination of user-auditor-user exists (not address(0)). ASSUMES ONLY MANY-1 RELATIONSHIP BETWEEN USERS AND AUDITOR
    mapping(uint256 => address) public cheqAuditor;
    mapping(uint256 => uint256) public cheqInspectionPeriod;
//     mapping(uint256 => bool) public cheqVoided;
    address public writeRule;
    address public transferRule;
    address public fundRule;
    address public cashRule;
    address public approveRule;
    string private baseURI;

    constructor(
        address registrar, 
        address _writeRule, 
        address _transferRule, 
        address _fundRule, 
        address _cashRule, 
        address _approveRule,
        string memory __baseURI
        ) ModuleBase(registrar){
        writeRule = _writeRule;
        transferRule = _transferRule;
        fundRule = _fundRule;
        cashRule = _cashRule;
        approveRule = _approveRule;
        baseURI = __baseURI;
    }

    function processWrite(address caller, address /*owner*/, uint cheqId, DataTypes.Cheq calldata /*cheq*/, bytes calldata initData) external returns (bool) {
        (address auditor, uint256 inspectionPeriod) = abi.decode(initData, (address, uint256));
        require(userAuditor[caller][auditor] && auditorUser[auditor][caller], "");
        cheqAuditor[cheqId] = auditor;
        cheqInspectionPeriod[cheqId] = inspectionPeriod;  // TODO change to endInspectionTime
        return true;

    }
    function processTransfer(address caller, address from, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory data) external returns (bool) {
//     function isTransferable(uint256 cheqId, address caller) public view returns(bool){
//         // cheq._isApprovedOrOwner(caller, cheqId);  // Need to find out if this is true and return it
//         return crx.ownerOf(cheqId)==caller;
//     }
    }
    function processFund(address caller, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external pure returns (bool) {
        return false;
    }
    function processCash(address caller, address to, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool) {
//     function cashable(uint256 cheqId, address caller, uint256 /* amount */) public view returns(uint256) {  // Let anyone see what's cashable, ALSO
//         if (block.timestamp >= cheqCreated[cheqId]+cheqInspectionPeriod[cheqId]
//             || crx.ownerOf(cheqId)!=caller
//             || cheqVoided[cheqId]){
//             return 0;
//         } else{
//             return crx.cheqEscrowed(cheqId);
//         }
//     }

//     function cashCheq(uint256 cheqId, uint256 amount) public {
//         // require(cheq.ownerOf(cheqId)==_msgSender(), "Non-owner");  // Keep this check to let user know they don't own it?
//         uint256 cashingAmount = cashable(cheqId, _msgSender(), amount);
//         require(cashingAmount>0, "Not cashable");
//         crx.cash(cheqId, _msgSender(), cashingAmount);
//     }
    }

    function processApproval(address caller, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory initData) external pure returns (bool) {
        return true;
    }

    function tokenURI(uint256 /*tokenId*/) external pure returns (string memory){
        return "";
    }

//     function voidCheq(uint256 cheqId) external {
//         require(cheqAuditor[cheqId]==_msgSender(), "Only auditor");
//         cheqVoided[cheqId] = true;
//         crx.cash(cheqId, crx.cheqDrawer(cheqId), crx.cheqEscrowed(cheqId));  // Return escrow to drawer
//     }
//     function status(uint256 cheqId, address caller) public view returns(string memory){
//         if(cashable(cheqId, caller) != 0){
//             return "mature";
//         } else if(cheqVoided[cheqId]){
//             return "voided";
//         } else {
//             return "pending";
//         }
//     }
}
