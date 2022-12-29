// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
// import "../contracts/CheqRegistrar.sol";
// import "openzeppelin/token/ERC20/IERC20.sol";
// import "openzeppelin/access/Ownable.sol";

// contract HandshakeTimeLock is ICheqBroker, Ownable {
//     CRX public crx;

//     constructor(CRX _crx){
//         crx = _crx;
//     }

//     mapping(address => mapping(address => bool)) public userAuditor; // Whether User accepts Auditor
//     mapping(address => mapping(address => bool)) public auditorUser; // Whether Auditor accepts User
//     // mapping(address => mapping(address => address)) public acceptedCombos;  // Whether this combination of user-auditor-user exists (not address(0)). ASSUMES ONLY MANY-1 RELATIONSHIP BETWEEN USERS AND AUDITOR
//     mapping(uint256 => address) public cheqAuditor;
//     mapping(uint256 => uint256) public cheqCreated;
//     mapping(uint256 => uint256) public cheqInspectionPeriod;
//     mapping(uint256 => bool) public cheqVoided;

//     function isWriteable(
//         address sender,
//         IERC20 _token,
//         uint256 amount,
//         uint256 escrowed,
//         address recipient,
//         address owner,
//         address auditor,
//         uint256 inspectionPeriod
//         ) public view returns(bool) {
//         return userAuditor[sender][auditor] && auditorUser[auditor][sender];
//     }

//     function writeCheq(
//         IERC20 _token,
//         uint256 amount,
//         uint256 escrowed,
//         address recipient,
//         address owner,
//         address auditor,
//         uint256 inspectionPeriod
//         ) external returns(uint256){
//         require(isWriteable(_msgSender(), _token, amount, escrowed, recipient, owner, auditor, inspectionPeriod), "Not writeable");
//         uint256 cheqId = crx.write(_msgSender(), recipient, _token, amount, escrowed, owner);
//         cheqCreated[cheqId] = block.timestamp;
//         cheqAuditor[cheqId] = auditor;
//         cheqInspectionPeriod[cheqId] = inspectionPeriod;
//         return cheqId;
//     }

//     function isTransferable(uint256 cheqId, address caller) public view returns(bool){
//         // cheq._isApprovedOrOwner(caller, cheqId);  // Need to find out if this is true and return it
//         return crx.ownerOf(cheqId)==caller;
//     }

//     function fundable(uint256 cheqId, address caller, uint256 amount) public view returns(uint256) {
//         return 0;
//     }

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

//     function isApprovable(uint256 cheqId, address caller, address to) external view returns(bool){
//         return true;
//     }
//     function tokenURI(uint256 tokenId) external view returns (string memory){
//         return "";
//     }
// }

// // require(
// //     _isApprovedOrOwner(_msgSender(), cheqId),
// //     "Transfer disallowed"
// // );

//     // function depositWrite(
//     //     address from,
//     //     IERC20 _token,
//     //     uint256 amount,
//     //     uint256 escrowed,
//     //     address recipient,
//     //     address owner
//     //     ) external
//     //     returns (uint256){
//     //     require(crx.deposit(from, _token, amount), "deposit failed");
//     //     return crx.write(from, recipient, _token, amount, escrowed, owner);
//     // }
