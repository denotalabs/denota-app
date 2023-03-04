// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
// import {ModuleBase} from "../../ModuleBase.sol";
// import {DataTypes} from "../../libraries/DataTypes.sol";
// import {ICheqModule} from "../../interfaces/ICheqModule.sol";
// import {ICheqRegistrar} from "../../interfaces/ICheqRegistrar.sol";

// // import "./lib/GenesisUtils.sol";
// // import "./interfaces/ICircuitValidator.sol";
// // import "../lib/GenesisUtils.sol";
// // import "../lib/SpongePoseidon.sol";
// // import "../lib/Poseidon.sol";
// // import "../interfaces/ICircuitValidator.sol";
// // import "../interfaces/IZKPVerifier.sol";

// contract ZKPVerifier is IZKPVerifier, Ownable {
//     // msg.sender-> ( requestID -> is proof given )
//     mapping(address => mapping(uint64 => bool)) public proofs;

//     mapping(uint64 => ICircuitValidator.CircuitQuery) public requestQueries;
//     mapping(uint64 => ICircuitValidator) public requestValidators;

//     uint64[] internal _supportedRequests;

//     function submitZKPResponse(
//         uint64 requestId,
//         uint256[] calldata inputs,
//         uint256[2] calldata a,
//         uint256[2][2] calldata b,
//         uint256[2] calldata c
//     ) public override returns (bool) {
//         require(
//             requestValidators[requestId] != ICircuitValidator(address(0)),
//             "validator is not set for this request id"
//         ); // validator exists
//         require(
//             requestQueries[requestId].queryHash != 0,
//             "query is not set for this request id"
//         ); // query exists

//         _beforeProofSubmit(requestId, inputs, requestValidators[requestId]);

//         require(
//             requestValidators[requestId].verify(
//                 inputs,
//                 a,
//                 b,
//                 c,
//                 requestQueries[requestId].queryHash
//             ),
//             "proof response is not valid"
//         );

//         proofs[msg.sender][requestId] = true; // user provided a valid proof for request

//         _afterProofSubmit(requestId, inputs, requestValidators[requestId]);
//         return true;
//     }

//     function getZKPRequest(uint64 requestId)
//         public
//         view
//         override
//         returns (ICircuitValidator.CircuitQuery memory)
//     {
//         return requestQueries[requestId];
//     }

//     function setZKPRequest(
//         uint64 requestId,
//         ICircuitValidator validator,
//         uint256 schema,
//         uint256 claimPathKey,
//         uint256 operator,
//         uint256[] calldata value
//     ) public override onlyOwner returns (bool) {
//         uint256 valueHash = SpongePoseidon.hash(value);
//         // only merklized claims are supported (claimPathNotExists is false, slot index is set to 0 )
//         uint256 queryHash = PoseidonUnit6L.poseidon(
//             [schema, 0, operator, claimPathKey, 0, valueHash]
//         );

//         return
//             setZKPRequestRaw(
//                 requestId,
//                 validator,
//                 schema,
//                 claimPathKey,
//                 operator,
//                 value,
//                 queryHash
//             );
//     }

//     function setZKPRequestRaw(
//         uint64 requestId,
//         ICircuitValidator validator,
//         uint256 schema,
//         uint256 claimPathKey,
//         uint256 operator,
//         uint256[] calldata value,
//         uint256 queryHash
//     ) public override onlyOwner returns (bool) {
//         if (requestValidators[requestId] == ICircuitValidator(address(0x00))) {
//             _supportedRequests.push(requestId);
//         }
//         requestQueries[requestId].queryHash = queryHash;
//         requestQueries[requestId].operator = operator;
//         requestQueries[requestId].circuitId = validator.getCircuitId();
//         requestQueries[requestId].claimPathKey = claimPathKey;
//         requestQueries[requestId].schema = schema;
//         requestQueries[requestId].value = value;
//         requestValidators[requestId] = validator;
//         return true;
//     }

//     function getSupportedRequests() public view returns (uint64[] memory arr) {
//         return _supportedRequests;
//     }

//     /**
//      * @dev Hook that is called before any proof response submit
//      */
//     function _beforeProofSubmit(
//         uint64 requestId,
//         uint256[] memory inputs,
//         ICircuitValidator validator
//     ) internal virtual {}

//     /**
//      * @dev Hook that is called after any proof response submit
//      */
//     function _afterProofSubmit(
//         uint64 requestId,
//         uint256[] memory inputs,
//         ICircuitValidator validator
//     ) internal virtual {}
// }

// contract ClaimWithID is ZKPVerifier {
//     mapping(uint256 => uint64) public requiredProofs;

//     event Proof(uint256 cheqId, uint64 proof);

//     function _requireProof(address prover, uint64 cheqId) internal {
//         require(proofs[prover][requiredProofs[cheqId]], "Proof failed");
//     }

//     constructor(
//         address registrar,
//         DataTypes.WTFCFees memory _fees,
//         string memory __baseURI
//     ) ModuleBase(registrar, _fees) {
//         _URI = __baseURI;
//     }

//     function processWrite(
//         address, /*caller*/
//         address, /*owner*/
//         uint256 cheqId,
//         address currency,
//         uint256 escrowed,
//         uint256 instant,
//         bytes calldata initData
//     ) external override onlyRegistrar returns (uint256) {
//         // require(instant == 0, "Instant not supported");  // Let them get part?
//         (uint64 requiredProof, address dappOperator) = abi.decode(
//             initData,
//             (uint256, address)
//         );
//         requiredProofs[cheqId] = requiredProof;

//         uint256 moduleFee = (escrowed * fees.transferBPS) / BPS_MAX;
//         revenue[dappOperator][currency] += moduleFee;
//         emit Proof(cheqId, requiredProof);
//         return moduleFee;
//     }

//     function processTransfer(
//         address caller,
//         address approved,
//         address owner,
//         address, /*from*/
//         address to,
//         uint256, /*cheqId*/
//         address, /*currency*/
//         uint256, /*escrowed*/
//         uint256, /*createdAt*/
//         bytes memory /*data*/
//     ) external view override onlyRegistrar returns (uint256) {
//         require(caller == owner || caller == approved, "Not owner or approved");
//         _requireProof(to, cheqId);
//         return 0;
//     }

//     function processFund(
//         address, /*caller*/
//         address, /*owner*/
//         uint256, /*amount*/
//         uint256, /*instant*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes calldata /*initData*/
//     ) external view override onlyRegistrar returns (uint256) {
//         require(false, "Only sending and cashing");
//         return 0;
//     }

//     function processCash(
//         address caller,
//         address owner,
//         address, /*to*/
//         uint256 amount,
//         uint256 cheqId,
//         DataTypes.Cheq calldata cheq,
//         bytes calldata initData
//     ) external override onlyRegistrar returns (uint256) {
//         require(caller == owner, "Only owner can cash");
//         require(amount == cheq.escrowed, "Must fully cash");

//         _requireProof(owner, cheqId);

//         address dappOperator = abi.decode(initData, (address));
//         uint256 moduleFee = (amount * fees.transferBPS) / BPS_MAX;
//         revenue[dappOperator][cheq.currency] += moduleFee;
//         return moduleFee;
//     }

//     function processApproval(
//         address caller,
//         address owner,
//         address, /*to*/
//         uint256, /*cheqId*/
//         DataTypes.Cheq calldata, /*cheq*/
//         bytes memory /*initData*/
//     ) external view override onlyRegistrar {
//         require(caller == owner, "Only owner can approve");
//     }

//     function processTokenURI(uint256 tokenId)
//         external
//         view
//         override
//         returns (string memory)
//     {
//         return
//             bytes(_URI).length > 0
//                 ? string(abi.encodePacked(_URI, tokenId))
//                 : "";
//     }
// }
