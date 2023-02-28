// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";
import {IWriteRule, ITransferRule, IFundRule, ICashRule, IApproveRule} from "../interfaces/IWTFCRules.sol";

/**
 * Note: Only payments, allows sender to choose when to release and whether to reverse (assuming it's not released yet)
 */
// contract ReversableTimelock is ModuleBase {
//     mapping(uint256 => address) public inspector;
//     mapping(uint256 => bool) public isReleased;

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
//         /**
//         (cheq.amount != 0) &&  // Cheq must have a face value
//         (cheq.drawer != cheq.recipient) && // Drawer and recipient aren't the same
//         (owner == cheq.drawer || owner == cheq.recipient) &&  // Either drawer or recipient must be owner
//         (caller == cheq.drawer || caller == cheq.recipient) &&  // Delegated pay/requesting not allowed
//         (cheq.escrowed == 0 || cheq.escrowed == cheq.amount) &&  // Either send unfunded or fully funded cheq
//         (cheq.recipient != address(0) && owner != address(0))  // Can't send to zero address
//          */
//         IWriteRule(writeRule).canWrite(
//             caller,
//             owner,
//             cheqId,
//             cheq,
//             directAmount,
//             initData
//         );
//         (address _inspector, address referer) = abi.decode(
//             initData,
//             (address, address)
//         );
//         inspector[cheqId] = _inspector;
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
//         address cheqInspector = inspector[cheqId];
//         require(from == owner, "Not from NFT holder");
//         require(!isReleased[cheqId], "Is already released");
//         require(
//             caller == owner || isApproved || caller == cheqInspector,
//             "Only owner or inspector"
//         );
//         if (caller == cheqInspector) {
//             require(to == cheq.drawer, "Only reverse to drawer");
//         }
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
//         require(false, "Simple escrows only");
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
//         ICashRule(cashRule).canCash(
//             caller,
//             owner,
//             to,
//             amount,
//             cheqId,
//             cheq,
//             initData
//         );
//         // require(amount == cheq.escrowed, "Can only cash full amounts");
//         // require(cheq.mintTimestamp + inspectionPeriod[cheqId] <= block.timestamp, "Can only cash after inspection");
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
//         IApproveRule(approveRule).canApprove(
//             caller,
//             owner,
//             to,
//             cheqId,
//             cheq,
//             initData
//         );
//     }

//     function processTokenURI(
//         uint256 /*tokenId*/
//     ) external pure override returns (string memory) {
//         return "";
//     }
// }
