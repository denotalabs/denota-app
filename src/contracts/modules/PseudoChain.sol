// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;

// import "openzeppelin/token/ERC721/ERC721.sol";
// import "openzeppelin/token/ERC20/IERC20.sol";
// import "openzeppelin/access/Ownable.sol";
// import {CheqRegistrar} from "./CheqRegistrar.sol";
// import "./ICheqModule.sol";

// contract PseudoChain is ICheqModule, Ownable, ERC721 {
//     CheqRegistrar public cheq;
//     mapping(uint256 => uint256) public blockCashTime;

//     constructor(CheqRegistrar _cheq) ERC721("PsuedoBlockChain", "PBC") {
//         cheq = _cheq;
//         blockCashTime[0] = block.timestamp;
//     }

//     function writeCheq(
//         IERC20 _token,
//         uint256 amount,
//         uint256,
//         address
//     ) public returns (uint256) {
//         // require(blockCashTime[]);
//         uint256 cheqId = cheq.write(
//             address(this),
//             address(this),
//             _msgSender(),
//             _token,
//             amount,
//             amount,
//             _msgSender()
//         );
//         blockCashTime[cheqId] = blockCashTime[cheqId - 1] + 1 days;
//         return cheqId;
//     }

//     function isTransferable(
//         uint256, /* cheqId */
//         address, /* caller */
//         address /* to */
//     ) public pure returns (bool) {
//         return false;
//     }

//     function transferCheq(uint256 cheqId, address to) public {
//         require(isTransferable(cheqId, _msgSender(), to), "Not owner");
//         cheq.transferFrom(_msgSender(), to, cheqId);
//     }

//     function getApproved(uint256 cheqId)
//         public
//         view
//         override(ERC721, ICheqModule)
//         returns (address)
//     {
//         return address(0); // for now
//     }

//     function approveCheq(uint256 cheqId, address to) external returns (bool) {
//         return true;
//     }

//     function fundable(
//         uint256, /* cheqId */
//         address, /* caller */
//         uint256 /* amount */
//     ) public pure returns (uint256) {
//         return 0;
//     }

//     function fundCheq(uint256 cheqId, uint256 amount) public {
//         uint256 fundableAmount = fundable(cheqId, _msgSender(), amount);
//         require(fundableAmount == amount, "Cant fund this amount");
//         cheq.fund(cheqId, _msgSender(), amount);
//     }

//     function cashable(
//         uint256 cheqId,
//         address, /* caller */
//         uint256 /* amount */
//     ) public view returns (uint256) {
//         if (false) {
//             // "0"*n+"..." == keccack((keccack(cheqId) + hash)
//             return cheq.cheqEscrowed(cheqId);
//         } else {
//             return 0;
//         }
//     }

//     function cashCheq(uint256 cheqId, uint256 amount) public {
//         uint256 cashableAmount = cashable(cheqId, _msgSender(), amount);
//         require(cashableAmount == amount, "Cant cash this amount");
//         cheq.cash(cheqId, _msgSender(), amount);
//     }

//     function tokenURI(uint256 tokenId)
//         public
//         view
//         override(ERC721, ICheqModule)
//         returns (string memory)
//     {
//         return string(abi.encodePacked(_baseURI(), tokenId));
//     }
// }
