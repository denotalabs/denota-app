// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/utils/Strings.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";
import {ModuleBase} from "../ModuleBase.sol";
import {DataTypes} from "../libraries/DataTypes.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../interfaces/ICheqRegistrar.sol";

/**
 * @notice Contract: stores invoice structs, allows freelancer/client to set work status',
 */
contract Marketplace is ModuleBase, Ownable {
    using Strings for uint256;
    // `InProgress` might not need to be explicit (Invoice.workerStatus=ready && Invoice.clientStatus=ready == working)
    // QUESTION: Should this pertain to the current milestone??
    enum Status {
        Waiting,
        Ready,
        InProgress,
        Disputing,
        Resolved,
        Finished
    }
    // Question: Should milestones have a startTime? What about Statuses?
    // Question: Whether and how to track multiple milestone funding?
    struct Milestone {
        uint256 price; // Amount the milestone is worth
        bool workerFinished; // Could pack these bools more
        bool clientReleased;
        bool workerCashed;
    }
    // Can add expected completion date and refund partial to relevant party if late
    struct Invoice {
        // TODO can optimize these via smaller types and packing
        address drawer;
        address recipient;
        uint256 startTime;
        uint256 currentMilestone;
        uint256 totalMilestones;
        Status workerStatus;
        Status clientStatus;
        bytes32 documentHash;
    }
    // mapping(uint256 => uint256) public inspectionPeriods; // Would this give the reversibility period?
    mapping(uint256 => Invoice) public invoices;
    mapping(uint256 => Milestone[]) public milestones;

    constructor(
        address registrar,
        DataTypes.WTFCFees memory _fees,
        string memory __baseURI
    ) ModuleBase(registrar, _fees) {
        _URI = __baseURI;
    }

    // function setBaseURI(string calldata __baseURI) external onlyOwner {
    //     _URI = __baseURI;
    // }

    function processWrite(
        address caller,
        address owner,
        uint256 cheqId,
        address currency,
        uint256 escrowed,
        uint256 instant,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        // require(caller == owner, "Not invoice");
        // require(cheq.drawer == caller, "Can't send on behalf");
        // require(cheq.recipient != owner, "Can't self send");
        // require(cheq.amount > 0, "Can't send cheq with 0 value");

        // require(milestonePrices.sum() == cheq.amount);

        (
            address drawer,
            address recipient,
            bytes32 documentHash,
            uint256[] memory milestonePrices
        ) = abi.decode(initData, (address, address, bytes32, uint256[]));
        uint256 numMilestones = milestonePrices.length;
        require(numMilestones > 1, "Module: Insufficient milestones"); // First milestone is upfront payment

        for (uint256 i = 0; i < numMilestones; i++) {
            milestones[cheqId].push(
                Milestone({
                    price: milestonePrices[i],
                    workerFinished: false,
                    clientReleased: false,
                    workerCashed: false
                })
            ); // Can optimize on gas much more
        }
        invoices[cheqId].drawer = drawer;
        invoices[cheqId].recipient = recipient;
        invoices[cheqId].documentHash = documentHash;
        invoices[cheqId].totalMilestones = numMilestones;
        return fees.writeBPS;
    }

    function processTransfer(
        address, /*caller*/
        address, /*approved*/
        address, /*owner*/
        address, /*from*/
        address, /*to*/
        uint256 cheqId,
        address, /*currency*/
        uint256, /*escrowed*/
        uint256, /*createdAt*/
        bytes memory /*data*/
    ) external override onlyRegistrar returns (uint256) {
        // Checks if caller is ownerOrApproved
        return fees.transferBPS;
    }

    // QUESTION: Who should/shouldn't be allowed to fund?
    // QUESTION: Should `amount` throw on milestone[currentMilestone].price != amount or tell registrar correct amount?
    // QUESTION: Should funder be able to fund whatever amounts they want?
    // QUESTION: Should funding transfer the money to the client?? Or client must claim?
    function processFund(
        address caller,
        address owner,
        uint256 amount,
        uint256 instant,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        // Client escrows the first milestone (is the upfront)
        // Must be milestone[0] price (currentMilestone == 0)
        // increment currentMilestone (client can cash previous milestone)
        //

        /**
        struct Milestone {
            uint256 price;  // Amount the milestone is worth
            bool workerFinished;  // Could pack these bools more
            bool clientReleased;
            bool workerCashed;
        }
        // Can add expected completion date and refund partial to relevant party if late
        struct Invoice {
            uint256 startTime;
            uint256 currentMilestone;
            uint256 totalMilestones;
            Status workerStatus;
            Status clientStatus;
            // bytes32 documentHash;
        }
         */
        // require(caller == cheq.recipient, "Module: Only client can fund");
        if (invoices[cheqId].startTime == 0)
            invoices[cheqId].startTime = block.timestamp;

        invoices[cheqId].clientStatus = Status.Ready;

        uint256 oldMilestone = invoices[cheqId].currentMilestone;
        require(
            amount == milestones[cheqId][oldMilestone].price,
            "Module: Incorrect milestone amount"
        ); // Question should module throw on insufficient fund or enforce the amount?
        milestones[cheqId][oldMilestone].workerFinished = true;
        milestones[cheqId][oldMilestone].clientReleased = true;
        invoices[cheqId].currentMilestone += 1;
        return fees.fundBPS;
    }

    function processCash(
        // Must allow the funder to cash the escrows too
        address caller,
        address owner,
        address to,
        uint256 amount,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external override onlyRegistrar returns (uint256) {
        // require(caller == owner, "");
        require(
            invoices[cheqId].currentMilestone > 0,
            "Module: Can't cash yet"
        );
        uint256 lastMilestone = invoices[cheqId].currentMilestone - 1;
        milestones[cheqId][lastMilestone].workerCashed = true; //
        return fees.cashBPS;
    }

    function processApproval(
        address caller,
        address owner,
        address to,
        uint256 cheqId,
        DataTypes.Cheq calldata cheq,
        bytes memory initData
    ) external override onlyRegistrar {}

    // function processOwnerOf(address owner, uint256 tokenId) external view returns(bool) {}

    function processTokenURI(uint256 tokenId)
        public
        view
        override
        onlyRegistrar
        returns (string memory)
    {
        string memory __baseURI = _baseURI();
        return
            bytes(__baseURI).length > 0
                ? string(abi.encodePacked(_URI, tokenId.toString()))
                : "";
    }

    /*//////////////////////////////////////////////////////////////
                            Module Functions
    //////////////////////////////////////////////////////////////*/
    function _baseURI() internal view returns (string memory) {
        return _URI;
    }

    function getMilestones(uint256 cheqId)
        public
        view
        returns (Milestone[] memory)
    {
        return milestones[cheqId];
    }

    function setStatus(uint256 cheqId, Status newStatus) public {
        Invoice storage invoice = invoices[cheqId];

        // (address drawer, address recipient) = ICheqRegistrar(REGISTRAR)
        //     .cheqDrawerRecipient(cheqId);
        require(
            _msgSender() == invoices[cheqId].drawer ||
                _msgSender() == invoices[cheqId].recipient,
            "Module: Unauthorized"
        );

        bool isWorker = _msgSender() == invoices[cheqId].drawer;
        Status oldStatus = isWorker
            ? invoice.workerStatus
            : invoice.clientStatus;

        require(
            oldStatus < newStatus ||
                (oldStatus == Status.Resolved && newStatus == Status.Disputing),
            "Module: Status not allowed"
        ); // Parties can change resolved back to disputed and back to in progress
        if (isWorker) {
            invoice.workerStatus = newStatus;
        } else {
            invoice.clientStatus = newStatus;
        }
    }
}
