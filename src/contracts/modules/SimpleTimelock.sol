// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * @notice A simple time release module
 * Escrowed tokens are cashable after the releaseDate
 */
// contract SimpleTimelock is
//     ModuleBase // VenCashPal module
// {
//     mapping(uint256 => bool) public isCashed;
//     mapping(uint256 => uint256) public releaseDate;

//     constructor(
//         address registrar,
//         address _writeRule,
//         address _transferRule,
//         address _fundRule,
//         address _cashRule,
//         address _approveRule,
//         DataTypes.WTFCFees memory _fees,
//         string memory __baseURI
//     )
//         ModuleBase(
//             registrar,
//             _writeRule,
//             _transferRule,
//             _fundRule,
//             _cashRule,
//             _approveRule,
//             _fees
//         )
//     {
//         // ERC721("SSTL", "SelfSignTimeLock") TODO: enumuration/registration of module features (like Lens?)
//         _URI = __baseURI;
//     }

//     function processWrite(
//         address caller,
//         address owner,
//         uint256 cheqId,
//         DataTypes.Cheq calldata cheq,
//         uint256 directAmount,
//         bytes calldata initData
//     ) external override onlyRegistrar returns (uint256) {
//         IWriteRule(writeRule).canWrite(
//             caller,
//             owner,
//             cheqId,
//             cheq,
//             directAmount,
//             initData
//         );
//         // require(cheq.escrowed == cheq.amount, "");

//         uint256 _releaseDate = abi.decode(initData, (uint256)); // Frontend uploads (encrypted) memo document and the URI is linked to cheqId here (URI and content hash are set as the same)
//         releaseDate[cheqId] = _releaseDate;
//         // Need event
//         return fees.writeBPS;
//     }

//     function processTransfer(
//         address caller,
//         bool isApproved,
//         address owner,
//         address from,
//         address to,
//         uint256 cheqId,
//         DataTypes.Cheq calldata cheq,
//         bytes memory data
//     ) external override onlyRegistrar returns (uint256) {
//         // TODO need to pass approval status of the caller
//         require(isCashed[cheqId], "Needs full funding");
//         ITransferRule(transferRule).canTransfer(
//             caller,
//             isApproved,
//             owner,
//             from,
//             to,
//             cheqId,
//             cheq,
//             data
//         ); // Checks if caller is ownerOrApproved
//         return fees.transferBPS;
//     }

//     function processFund(
//         address caller,
//         address owner,
//         uint256 amount,
//         uint256 directAmount,
//         uint256 cheqId,
//         DataTypes.Cheq calldata cheq,
//         bytes calldata initData
//     ) external override onlyRegistrar returns (uint256) {
//         require(!isCashed[cheqId], "Already cashed"); // How to abstract this?
//         // require(endDate[cheqId] <= block.timestamp, "Funding over");
//         // require(cheq.escrowed + amount <= cheq.amount, "Overfunding");
//         IFundRule(fundRule).canFund(
//             caller,
//             owner,
//             amount,
//             directAmount,
//             cheqId,
//             cheq,
//             initData
//         );
//         // uint256 fundAmount = cheq.escrowed + amount <= cheq.amount ? amount : cheq.amount - cheq.escrowed;
//         return fees.fundBPS;
//     }

//     function processCash(
//         address caller,
//         address owner,
//         address to,
//         uint256 amount,
//         uint256 cheqId,
//         DataTypes.Cheq calldata cheq,
//         bytes calldata initData
//     ) external override onlyRegistrar returns (uint256) {
//         require(!isCashed[cheqId], "Already cashed");
//         // require(cheq.escrowed == cheq.amount, "");
//         ICashRule(cashRule).canCash(
//             caller,
//             owner,
//             to,
//             amount,
//             cheqId,
//             cheq,
//             initData
//         );
//         isCashed[cheqId] = true;
//         return fees.cashBPS;
//     }

//     function processApproval(
//         address caller,
//         address owner,
//         address to,
//         uint256 cheqId,
//         DataTypes.Cheq calldata cheq,
//         bytes memory initData
//     ) external override onlyRegistrar {
//         require(isCashed[cheqId], "Must be cashed first");
//         IApproveRule(approveRule).canApprove(
//             caller,
//             owner,
//             to,
//             cheqId,
//             cheq,
//             initData
//         );
//     }

//     // TODO
//     function processTokenURI(uint256 tokenId)
//         external
//         view
//         override
//         returns (string memory)
//     {
//         // Allow cheq creator to update the URI?
//         uint256 _releaseDate = releaseDate[tokenId];
//         return string(abi.encodePacked(_URI, _releaseDate)); // ipfs://baseURU/memoHash --> memo // TODO encrypt upload on frontend
//     }
// }
