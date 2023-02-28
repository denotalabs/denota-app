// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * @notice A simple escrow module that includes an IPFS hash for memos (included in the URI) and whose value is released by the specified party
 */
// contract SimpleRelease is ModuleBase {
//     mapping(uint256 => bool) public isCashed;

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
//         if (directAmount > 0) isCashed[cheqId] = true; // is this cheaper? isCashed[cheqId] = directAmount;

//         bytes32 memoHash = abi.decode(initData, (bytes32)); // Frontend uploads (encrypted) memo document and the URI is linked to cheqId here (URI and content hash are set as the same)
//         memo[cheqId] = memoHash;

//         emit MemoWritten(cheqId, memoHash);

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
//         require(isCashed[cheqId], "Module: Only after cashing");
//         ITransferRule(transferRule).canTransfer(
//             caller,
//             isApproved,
//             owner,
//             from,
//             to,
//             cheqId,
//             cheq,
//             data
//         );
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
//         require(!isCashed[cheqId], "Module: Already cashed");
//         IFundRule(fundRule).canFund(
//             caller,
//             owner,
//             amount,
//             directAmount,
//             cheqId,
//             cheq,
//             initData
//         );
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
//         require(!isCashed[cheqId], "Module: Already cashed");
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
//         require(isCashed[cheqId], "Module: Must be cashed first"); // Question: Should this be the case?
//         IApproveRule(approveRule).canApprove(
//             caller,
//             owner,
//             to,
//             cheqId,
//             cheq,
//             initData
//         );
//     }

//     function processTokenURI(uint256 tokenId)
//         external
//         view
//         override
//         returns (string memory)
//     {
//         bytes32 memoHash = memo[tokenId];
//         return string(abi.encodePacked(_URI, memoHash)); // ipfs://baseURU/memoHash --> memo // TODO encrypt upload on frontend
//     }
// }
