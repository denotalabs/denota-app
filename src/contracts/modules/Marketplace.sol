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

/**
 * Question: How to ensure deployed modules point to correct CheqRegistrar and Globals?
 * TODO need to have a way for the marketplace owner to withdraw their fees
 * How will fees to module owner work?
- Contract Identification. [invoice document should contain this]
    You will need to identify what the payment agreement is being drafted for.
- Consenting Parties. [The cheq.drawer and cheq.recipient contain this]
    The next section will need to include detailed information about the parties involved in the contract.
- Agreement. [Status set by the client]
    The main portion of the payment contract will detail what both parties have agreed to in terms of payment, as well as the product and services that will be rendered. 
- Date. [Status set by the client]
    The agreement will need to be dated to prove when the payment agreement went into effect.
- Signature. [Freelancer sending invoice, client accepting]
    Both parties will need to sign the contract which indicates they agree to the terms, as well as performing their obligations.
 
 * @notice Contract: stores invoice structs, takes/sends WTFC fees to owner, allows owner to set URI, allows freelancer/client to set work status', 
 */
contract Marketplace is ModuleBase, Ownable, ICheqModule {
    using Strings for uint256;
    // `InProgress` might not need to be explicit (Invoice.workerStatus=ready && Invoice.clientStatus=ready == working)
    enum Status {
        Waiting,
        Ready,
        InProgress,
        Disputing,
        Resolved,
        Finished
    }
    // Question: Should milestones have a timestamp aspect? What about Statuses?
    struct Milestone {
        uint256 price;
        bool workerFinished;  // Could pack these bools more
        bool clientReleased;
    }
    // Can add expected completion date and refund partial to relevant party if late
    struct Invoice {
        uint256 startTime;
        Status workerStatus;
        Status clientStatus;
        // bytes32 documentHash;
        Milestone[] milestones;
    }
    // mapping(uint256 => uint256) public inspectionPeriods; // Would this give the reversibility period?
    mapping(uint256 => Invoice) public invoices;
    mapping(address => bool) public tokenWhitelist;
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
        ) ModuleBase(registrar){ // ERC721("SSTL", "SelfSignTimeLock") TODO: enumuration/registration of module features (like Lens )
        writeRule = _writeRule;
        transferRule = _transferRule;
        fundRule = _fundRule;
        cashRule = _cashRule;
        approveRule = _approveRule;
        baseURI = __baseURI;
    }

    function tokenURI(uint256 tokenId) public view onlyRegistrar returns (string memory) {
        // _requireMinted(tokenId);
        string memory __baseURI = _baseURI();
        return bytes(__baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }
    function _baseURI() internal view returns (string memory) {
        return baseURI;
    }

    function whitelistToken(address token, bool whitelist) public onlyOwner {
        tokenWhitelist[token] = whitelist;
    }
    
    function processWrite(
        address caller,
        address owner,
        uint cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external onlyRegistrar returns(bool){
        require(tokenWhitelist[cheq.currency], "Token not whitelisted");
        bool cheqIsWriteable = IWriteRule(writeRule).canWrite(caller, owner, cheqId, cheq, initData);
        /**
        require(cheq.drawer == caller, "Can't send on behalf");  // This could be delegated
        require(cheq.recipient != owner, "Can't self send");  // TODO figure out LENS' 721 ownership modification
        require(cheq.amount > 0, "Can't send cheq with 0 value");  // Library function could be canWrite()->bool
         */
        if (!cheqIsWriteable) return false;
        (uint256 startTime, Status workerStatus, Status clientStatus, Milestone[] memory milestones) = abi.decode(initData, (uint256, Status, Status, Milestone[]));
        require(milestones.length > 0, "No milestones");

        invoices[cheqId].startTime = startTime;
        invoices[cheqId].workerStatus = workerStatus;
        invoices[cheqId].clientStatus = clientStatus;
        
        for (uint256 i = 0; i < milestones.length; i++){ // invoices[cheqId].milestones = milestones;
            invoices[cheqId].milestones.push(milestones[i]);  // Can optimize on gas much more
        }
        return true;
    }
    // Where should require(ownerOf(cheqId) == msg.sender) be?
    function processTransfer(
        address caller, 
        address from,
        address to,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory initData
    ) external onlyRegistrar returns (bool) {  // Nothing additional needs to be added
        return ITransferRule(transferRule).canTransfer(caller, from, to, cheqId, cheq, initData);
    }

    function processFund(
        address caller,
        uint256 amount,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external onlyRegistrar returns (bool) {
        // uint256 fundableAmount = fundable(cheqId, _msgSender(), amount);
        // require(fundableAmount > 0, "Not fundable");  // Are
        // require(fundableAmount == amount, "Cant fund this amount");
        
        // cheqCreated[cheqId] = block.timestamp; // BUG: can update with 0 at any time- If it can be funded its an invoice, reset creation date for job start
        return IFundRule(fundRule).canFund(caller, amount, cheqId, cheq, initData);
    }

    function processCash(
        address caller, 
        address to,
        uint256 amount, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external onlyRegistrar returns (bool) {
        // add cashing logic
        return ICashRule(cashRule).canCash(caller, to, amount, cheqId, cheq, initData);
    }

    function processApproval(address caller, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory initData) external onlyRegistrar returns (bool){
        return IApproveRule(approveRule).canApprove(caller, to, cheqId, cheq, initData);
    }

    function setBaseURI(string calldata __baseURI) external onlyOwner {
        baseURI = __baseURI;
    }

    function setStatus(uint256 cheqId, Status newStatus) public {
        // TODO allow owner to set Status.Disputed to Status.Resolved. Can Resolved lead to continued work (Status.Working) or pay out based on the resolution? 
        // Do both parties need to set it to Status.Disputed? 
        // If one doesn't, should the arbitor only be allowed to payout the party with Status.Disputed?
        Invoice storage invoice = invoices[cheqId];

        bool isWorker = ICheqRegistrar(REGISTRAR).cheqDrawer(cheqId) == _msgSender();  // Cheaper to query individual or all?
        // Question: function cheqParties() public view returns (drawer, recipient){} exist?

        Status oldStatus = isWorker ? invoice.workerStatus : invoice.clientStatus;
        require(oldStatus < newStatus, "STATUS_REGRESS");
        if (!isWorker) {
            require(ICheqRegistrar(REGISTRAR).cheqRecipient(cheqId) == _msgSender(), "NOT_ALLOWED");
        }
        
        if (isWorker){
            invoice.workerStatus = newStatus;
        } else {
            invoice.clientStatus = newStatus;
        }
    }
}

// // BUG what if funder doesnt fund the invoice for too long??
// function cashable(
//     uint256 cheqId,
//     address caller,
//     uint256 /* amount */
// ) public view returns (uint256) {
//     // Invoice funder can cash before period, cheq writer can cash before period
//     // Chargeback case
//     if (
//         cheqFunder[cheqId] == caller &&
//         (block.timestamp <
//             cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])
//     ) {
//         // Funding party can rescind before the inspection period elapses
//         return cheq.cheqEscrowed(cheqId);
//     } else if (
//         cheq.ownerOf(cheqId) == caller &&
//         (block.timestamp >=
//             cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])
//     ) {
//         // Receiving/Owning party can cash after inspection period
//         return cheq.cheqEscrowed(cheqId);
//     } else if (isReleased[cheqId]) {
//         return cheq.cheqEscrowed(cheqId);
//     } else {
//         return 0;
//     }
// }
