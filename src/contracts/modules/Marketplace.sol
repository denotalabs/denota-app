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

/** Question: Should be an abstract contract for inheriting this module type?
 * @notice Contract: stores invoice structs, takes/sends WTFC fees to owner, allows owner to set URI, allows freelancer/client to set work status', 
 Can add: 
 function pauseWTFC() external onlyOwner {}
 function addAccountRole(address) external onlyOwner {canWrite[address], canTransfer[address]...} allow/disallow
 function process__() {_payFeeToOwner(); _;}
 function yieldWrite() {}
 function buyCheq() {};
 function

Writing:
 rule- cheq.amount == cheq.escrowed
 rule- IERC20(cheq.currency).balanceOf(cheq.drawer) > cheq.amount
 rule- tokenWhitelist[cheq.currency]
 rule- cheq.drawer == cheq.payer (Delegating someone to pay on your behalf)
Transferring:
 rule- cheq.timeCreated + inspectionPeriod[cheqID] >= block.timestamp
Funding:
 rule- cheq.milestones[currentMilestone].fundTime < block.timestamp (delinquent payment)
 rule- 
Cashing
 rule- 
URI
 rule- {allow drawer/owner/delegate to set URI}
 rule- 
 */
contract Marketplace is ModuleBase, Ownable, ERC721, ICheqModule {
    using Strings for uint256;
    // `InProgress` might not need to be explicit (Invoice.workerStatus=ready && Invoice.clientStatus=ready == working)
    enum Status {
        Waiting,
        Ready,
        InProgress,
        Disputing,
        Finished
    }
    // Should milestones have timestamp aspect?
    struct Milestone {
        uint256 amounts;
        bool workerFinished;
        bool clientReleasable;
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
    mapping(IERC20 => bool) public tokenWhitelist;
    address public writeRule;
    address public transferRule;
    address public fundRule;
    address public cashRule;
    address public approveRule;
    string private baseURI;

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        string memory __baseURI = _baseURI();
        return bytes(__baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }
    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function whitelistToken(IERC20 token, bool whitelist) public onlyOwner {
        tokenWhitelist[token] = whitelist;
    }

    constructor(
        address registrar, 
        address _writeRule, 
        address _transferRule, 
        address _fundRule, 
        address _cashRule, 
        address _approveRule,
        string memory __baseURI
        ) ERC721("SSTL", "SelfSignTimeLock") ModuleBase(registrar){
        writeRule = _writeRule;
        transferRule = _transferRule;
        fundRule = _fundRule;
        cashRule = _cashRule;
        approveRule = _approveRule;
        baseURI = __baseURI;
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

    function earlyRelease(uint256 cheqId, Status status) public {  // Should this allow the parties to set arbitrary Statuses?
        if (_msgSender() == ICheqRegistrar(REGISTRAR).cheqDrawer(cheqId)){
            invoices[cheqId].workerStatus = status;
        } else if (_msgSender() == ICheqRegistrar(REGISTRAR).cheqRecipient(cheqId)){
            invoices[cheqId].clientStatus = status;
        }
    }
}
