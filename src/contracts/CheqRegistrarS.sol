// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
// import "openzeppelin/access/Ownable.sol";
// import "openzeppelin/token/ERC20/IERC20.sol";
// import "openzeppelin/token/ERC721/ERC721.sol";
// import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
// import {Events} from "../contracts/libraries/Events.sol";
// import {RegistrarGov} from "../contracts/RegistrarGov.sol";
// import {DataTypes} from "../contracts/libraries/DataTypes.sol";
// import {ICheqModule} from "../contracts/interfaces/ICheqModule.sol";
// import {ICheqRegistrar} from "../contracts/interfaces/ICheqRegistrar.sol";
// import {CheqBase64Encoding} from "../contracts/libraries/CheqBase64Encoding.sol";

// /**
//  * @title  The Cheq Payment Registrar
//  * @notice The main contract where users can WTFCA cheqs
//  * @author Alejandro Almaraz
//  * @dev    Tracks ownership of cheqs' data + escrow, whitelists tokens/modules/rulesets, and collects revenue.
//  */
// contract CheqRegistrar is ERC721, Ownable, ICheqRegistrar, RegistrarGov {
//     using SafeERC20 for IERC20;
//     mapping(uint256 => DataTypes.Cheq) private _cheqInfo;
//     uint256 private _totalSupply;

//     constructor(DataTypes.WTFCFees memory _fees)
//         ERC721("denotaProtocol", "NOTA")
//         RegistrarGov(_fees)
//     {}

//     function write(
//         address currency,
//         uint256 escrowed,
//         uint256 instant, // if nonFungible is supported make sure this can't be used
//         address owner,
//         address module,
//         bytes calldata moduleWriteData
//     ) public payable returns (uint256) {
//         // require(msg.value >= _writeFlatFee, "INSUF_FEE"); // Question should flat fee be implemented?
//         require(validWrite(module, currency), "NOT_WHITELISTED"); // Module+token whitelist check

//         // Module hook
//         uint256 moduleFee = ICheqModule(module).processWrite(
//             _msgSender(),
//             owner,
//             _totalSupply,
//             currency,
//             escrowed,
//             instant,
//             moduleWriteData
//         );

//         uint256 cheqFee;
//         {
//             // Fee taking and escrowing
//             uint256 totalAmount = escrowed + instant; // TODO could optimize when 0
//             cheqFee = (totalAmount * fees.writeBPS) / BPS_MAX; // uint256 totalBPS = fees.writeBPS + moduleBPS; but need to emit and add to reserves
//             uint256 toEscrow = escrowed + cheqFee + moduleFee;
//             if (toEscrow > 0) {
//                 if (currency == address(0)) {
//                     require(msg.value == toEscrow, "");
//                 } else {
//                     IERC20(currency).safeTransferFrom(
//                         _msgSender(),
//                         address(this),
//                         toEscrow
//                     );
//                 }
//                 _registrarRevenue[currency] += cheqFee;
//                 _moduleRevenue[module][currency] += moduleFee;
//             }
//             if (instant > 0)
//                 if (currency != address(0)) {
//                     IERC20(currency).safeTransferFrom(
//                         _msgSender(),
//                         owner,
//                         instant
//                     );
//                 }
//         }

//         _safeMint(owner, _totalSupply);
//         _cheqInfo[_totalSupply].currency = currency;
//         _cheqInfo[_totalSupply].escrowed = escrowed;
//         _cheqInfo[_totalSupply].createdAt = block.timestamp;
//         _cheqInfo[_totalSupply].module = module;

//         emit Events.Written(
//             _msgSender(),
//             _totalSupply,
//             owner,
//             instant,
//             currency,
//             escrowed,
//             block.timestamp,
//             cheqFee,
//             moduleFee,
//             module,
//             moduleWriteData
//         );
//         unchecked {
//             return _totalSupply++;
//         } // NOTE: Will this ever overflow?
//     }

//     function safeTransferFrom(
//         address from,
//         address to,
//         uint256 tokenId,
//         bytes memory moduleTransferData
//     ) public override(ERC721, ICheqRegistrar) {
//         address owner = ownerOf(tokenId);
//         DataTypes.Cheq storage cheq = _cheqInfo[tokenId]; // Better to assign than to index?

//         // Module hook
//         uint256 moduleFee = ICheqModule(cheq.module).processTransfer(
//             _msgSender(),
//             getApproved(tokenId),
//             owner,
//             from, // TODO Might not be needed
//             to,
//             tokenId,
//             cheq.currency,
//             cheq.escrowed,
//             cheq.createdAt,
//             moduleTransferData
//         );

//         // Fee taking and escrowing
//         if (cheq.escrowed > 0) {
//             // Can't take from 0 escrow
//             uint256 cheqFee = (cheq.escrowed * fees.transferBPS) / BPS_MAX;
//             cheq.escrowed = cheq.escrowed - cheqFee - moduleFee;
//             _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
//             _registrarRevenue[cheq.currency] += cheqFee;
//             emit Events.Transferred(
//                 tokenId,
//                 owner,
//                 to,
//                 cheqFee,
//                 moduleFee,
//                 block.timestamp
//             );
//         } else {
//             // Must be case since fee's can't be taken without an escrow to take from
//             emit Events.Transferred(tokenId, owner, to, 0, 0, block.timestamp);
//         }

//         _safeTransfer(from, to, tokenId, "");
//     }

//     function fund(
//         uint256 cheqId,
//         uint256 amount,
//         uint256 instant,
//         bytes calldata fundData
//     ) external payable {
//         DataTypes.Cheq storage cheq = _cheqInfo[cheqId];
//         address owner = ownerOf(cheqId); // Is used twice

//         // Module hook
//         uint256 moduleBPS = ICheqModule(cheq.module).processFund(
//             _msgSender(),
//             owner,
//             amount,
//             instant,
//             cheqId,
//             cheq,
//             fundData
//         );

//         // Fee taking and escrow
//         uint256 totalAmount = amount + instant;
//         uint256 cheqFee = (totalAmount * fees.writeBPS) / BPS_MAX; // uint256 totalBPS = fees.writeBPS + moduleBPS; but need to emit and add to reserves
//         uint256 moduleFee = (totalAmount * moduleBPS) / BPS_MAX;
//         uint256 toEscrow = amount + cheqFee + moduleFee;
//         if (toEscrow > 0) {
//             IERC20(cheq.currency).safeTransferFrom(
//                 _msgSender(),
//                 address(this),
//                 toEscrow
//             );
//             _registrarRevenue[cheq.currency] += cheqFee;
//             _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
//         }
//         if (instant > 0)
//             IERC20(cheq.currency).safeTransferFrom(
//                 _msgSender(),
//                 owner,
//                 instant
//             );

//         emit Events.Funded(
//             _msgSender(),
//             cheqId,
//             amount,
//             instant,
//             fundData,
//             cheqFee,
//             moduleFee,
//             block.timestamp
//         );
//     }

//     function cash(
//         uint256 cheqId,
//         uint256 amount,
//         address to,
//         bytes calldata cashData
//     ) external payable {
//         // Should percent fee work here too?
//         DataTypes.Cheq storage cheq = _cheqInfo[cheqId];

//         // Module Hook
//         uint256 moduleBPS = ICheqModule(cheq.module).processCash(
//             _msgSender(),
//             ownerOf(cheqId),
//             to,
//             amount,
//             cheqId,
//             cheq,
//             cashData
//         );

//         // Fee taking
//         uint256 cheqFee = (amount * fees.cashBPS) / BPS_MAX;
//         uint256 moduleFee = (amount * moduleBPS) / BPS_MAX;
//         uint256 totalAmount = amount + cheqFee + moduleFee;

//         // Un-escrowing
//         require(cheq.escrowed >= totalAmount, "CANT_CASH_AMOUNT"); // TODO may cause funds to be stuck if fees are added
//         unchecked {
//             cheq.escrowed -= totalAmount;
//         } // Could this just underflow and revert anyway (save gas)?
//         if (cheq.currency == address(0)) {
//             (bool sent, ) = to.call{value: msg.value}("");
//             require(sent, "TRANSF_FAILED");
//         } else {
//             IERC20(cheq.currency).safeTransfer(to, amount);
//         }
//         _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
//         _registrarRevenue[cheq.currency] += cheqFee;

//         emit Events.Cashed(
//             _msgSender(),
//             cheqId,
//             to,
//             amount,
//             cashData,
//             cheqFee,
//             moduleFee,
//             block.timestamp
//         );
//     }

//     function approve(address to, uint256 tokenId)
//         public
//         override(ERC721, ICheqRegistrar)
//     {
//         require(to != _msgSender(), "SELF_APPROVAL");

//         // Module hook
//         DataTypes.Cheq memory cheq = _cheqInfo[tokenId];
//         ICheqModule(cheq.module).processApproval(
//             _msgSender(),
//             ownerOf(tokenId),
//             to,
//             tokenId,
//             cheq,
//             ""
//         );

//         // Approve
//         _approve(to, tokenId);
//     }

//     // function burn(uint256 tokenId) external { uint256 moduleFee = ICheqModule.processBurn(); _burn(tokenId);}
//     function cheqInfo(uint256 cheqId)
//         public
//         view
//         returns (DataTypes.Cheq memory)
//     {
//         return _cheqInfo[cheqId];
//     }

//     function cheqCurrency(uint256 cheqId) public view returns (address) {
//         return _cheqInfo[cheqId].currency;
//     }

//     function cheqEscrowed(uint256 cheqId) public view returns (uint256) {
//         return _cheqInfo[cheqId].escrowed;
//     }

//     function cheqModule(uint256 cheqId) public view returns (address) {
//         return _cheqInfo[cheqId].module;
//     }

//     function totalSupply() public view returns (uint256) {
//         return _totalSupply;
//     }

//     function tokenURI(uint256 _tokenId)
//         public
//         view
//         override
//         returns (string memory)
//     {
//         _requireMinted(_tokenId);
//         string memory _tokenURI = ICheqModule(_cheqInfo[_tokenId].module)
//             .processTokenURI(_tokenId);

//         return
//             CheqBase64Encoding.buildMetadata(
//                 _tokenId,
//                 _cheqInfo[_tokenId].currency,
//                 _cheqInfo[_tokenId].escrowed,
//                 _cheqInfo[_tokenId].createdAt,
//                 _cheqInfo[_tokenId].module,
//                 _tokenURI
//             );
//     }

//     function transferFrom(
//         address from,
//         address to,
//         uint256 tokenId
//     ) public override {
//         // Removed the approveOrOwner check, allow module to decide
//         safeTransferFrom(from, to, tokenId, "");
//     }

//     function setApprovalForAll(
//         address, /*operator*/
//         bool /*approved*/
//     ) public pure override {
//         // Question: Does OS require operators?
//         require(false, "OPERATORS_NOT_SUPPORTED");
//         // _setApprovalForAll(_msgSender(), operator, approved);
//     }
// }
