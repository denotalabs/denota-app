// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
// import {ModuleBase} from "../ModuleBase.sol";
// import {DataTypes} from "../libraries/DataTypes.sol";
// import {ICheqModule} from "../interfaces/ICheqModule.sol";
// import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";

// contract AttestationStation {
//     mapping(address => mapping(address => mapping(bytes32 => bytes)))
//         public attestations;

//     struct AttestationData {
//         address about;
//         bytes32 key;
//         bytes val;
//     }

//     event AttestationCreated(
//         address indexed creator,
//         address indexed about,
//         bytes32 indexed key,
//         bytes val
//     );

//     function attest(AttestationData[] memory _attestations) public {
//         for (uint256 i = 0; i < _attestations.length; ++i) {
//             AttestationData memory attestation = _attestations[i];
//             attestations[msg.sender][attestation.about][
//                 attestation.key
//             ] = attestation.val;
//             emit AttestationCreated(
//                 msg.sender,
//                 attestation.about,
//                 attestation.key,
//                 attestation.val
//             );
//         }
//     }
// }

// /// @notice only allows people you allow an attestation about to send you cheqs
// /// Only allow invoices by people who have been paid by a person before
// // A person successfully pays a freelancer
// // The freelancer can now send invoices
// contract AttestSendLock is ModuleBase {
//     // mapping(address(this) => mapping(senderAddress => mapping(recipAddress => amountBytes))) public creditAttestations;
//     // mapping(attestingAddress => mapping(aboutAddress => mapping(key => valueBytes))) public creditAttestations;
//     struct Gate {
//         address attSource;
//         address about;
//         bytes32 key;
//         uint256 index;
//         bytes32 expectedVal;
//     }

//     AttestationStation public AT_STAT;
//     mapping(address => Gate) public attestGates;
//     mapping(uint256 => address) public senders;

//     function _onlyAttestation(
//         address attester,
//         address about,
//         bytes32 key,
//         uint256 index,
//         bytes32 expectedVal
//     ) internal view {
//         require(
//             AT_STAT.attestations(attester, about, key)[index] == expectedVal,
//             "Not attested"
//         );
//     }

//     function updateGate(
//         address attester,
//         address about,
//         bytes32 data,
//         uint256 index,
//         bytes32 expectedVal
//     ) public {
//         attestGates[msg.sender] = Gate(
//             attester,
//             about,
//             data,
//             index,
//             expectedVal
//         );
//     }

//     constructor(
//         address registrar,
//         DataTypes.WTFCFees memory _fees,
//         string memory __baseURI
//     ) ModuleBase(registrar, _fees) {
//         _URI = __baseURI;
//     }

//     function processWrite(
//         address caller,
//         address owner,
//         uint256 cheqId,
//         address currency,
//         uint256 escrowed,
//         uint256 instant,
//         bytes calldata initData
//     ) external override onlyRegistrar returns (uint256) {
//         require(owner != address(0), "Address zero");
//         senders[cheqId] = caller;
//         (address drawer, address dappOperator) = abi.decode(
//             initData,
//             (address, address)
//         );
//         if (attestGates[owner].attSource != address(0)) {
//             _onlyAttestation( // Owner has set up whitelisting
//                 attestGates[owner].attSource,
//                 attestGates[owner].about,
//                 attestGates[owner].key,
//                 attestGates[owner].index,
//                 attestGates[owner].expectedVal
//             );
//         }
//         // require(amount != 0, "Rule: Amount == 0");
//         // require(
//         //     instant == amount || instant == 0, // instant=0 is for invoicing
//         //     "Rule: Must send full"
//         // );
//         // require(drawer != recipient, "Rule: Drawer == recipient");
//         // require(
//         //     caller == drawer || caller == recipient,
//         //     "Rule: Only drawer/receiver"
//         // );
//         // require(
//         //     owner == drawer || owner == recipient,
//         //     "Rule: Drawer/recipient != owner"
//         // );
//         // require(
//         //     recipient != address(0) &&
//         //         owner != address(0) &&
//         //         drawer != address(0),
//         //     "Rule: Can't use zero address"
//         // ); // TODO can be simplified

//         uint256 moduleFee;
//         {
//             uint256 totalAmount = escrowed + instant;
//             moduleFee = (totalAmount * fees.writeBPS) / BPS_MAX;
//         }
//         revenue[dappOperator][currency] += moduleFee;
//         return moduleFee;
//     }

//     function processTransfer(
//         address, /*caller*/
//         address, /*approved*/
//         address, /*owner*/
//         address, /*from*/
//         address, /*to*/
//         uint256, /*cheqId*/
//         address, /*currency*/
//         uint256 escrowed,
//         uint256, /*createdAt*/
//         bytes memory /*data*/
//     ) external view override onlyRegistrar returns (uint256) {
//         require(false, "Rule: Disallowed");
//         // require(payInfo[cheqId].wasPaid, "Module: Only after cashing");
//         uint256 moduleFee = (escrowed * fees.transferBPS) / BPS_MAX;
//         // revenue[referer][cheq.currency] += moduleFee; // TODO who does this go to if no bytes? Set to CheqRegistrarOwner
//         return moduleFee;
//     }

//     function processFund(
//         address caller,
//         address owner,
//         uint256 amount,
//         uint256 instant,
//         uint256 cheqId,
//         DataTypes.Cheq calldata cheq,
//         bytes calldata initData
//     ) external override onlyRegistrar returns (uint256) {
//         // require(amount == 0, "Rule: Only direct pay");
//         // require(
//         //     instant == payInfo[cheqId].amount,
//         //     "Rule: Only full direct amount"
//         // );
//         // require(
//         //     caller == payInfo[cheqId].drawer ||
//         //         caller == payInfo[cheqId].recipient,
//         //     "Rule: Only drawer/recipient"
//         // );
//         // require(caller != owner, "Rule: Not owner");
//         // require(!payInfo[cheqId].wasPaid, "Module: Already cashed");
//         address referer = abi.decode(initData, (address));
//         uint256 moduleFee = ((amount + instant) * fees.fundBPS) / BPS_MAX;
//         revenue[referer][cheq.currency] += moduleFee;
//         return moduleFee;
//     }

//     function processCash(
//         address, /*caller*/
//         address owner,
//         address, /*to*/
//         uint256 amount,
//         uint256 cheqId,
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata /*initData*/
//     ) external override onlyRegistrar returns (uint256) {
//         require(false, "Rule: Disallowed");
//         // address referer = abi.decode(initData, (address));
//         // revenue[referer][cheq.currency] += moduleFee;
//         // payInfo[cheqId].wasPaid = true;
//         // IDEA Post to attestation station here

//         // bytes32 sender = bytes32(bytes20(senders[cheqId]));
//         // bytes memory amount = bytes32(amount)

//         bytes memory attestationValue = AT_STAT.attestations(
//             senders[cheqId],
//             owner,
//             bytes32("successful_cash")
//         );
//         attestationValue[attestationValue.length + 1] = abi.encode(amount);
//         // attestation[0] = AttestationStation.AttestationData(
//         //     owner,
//         //     sender,
//         //     amount
//         // );
//         AT_STAT.attest(attestationValue);

//         uint256 moduleFee = (amount * fees.cashBPS) / BPS_MAX;
//         return moduleFee;
//     }

//     function processApproval(
//         address, /*caller*/
//         address, /*owner*/
//         address, /*to*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes memory /*initData*/
//     ) external view override onlyRegistrar {
//         require(false, "Rule: Disallowed");
//         // require(wasPaid[cheqId], "Module: Must be cashed first");
//     }
// }
