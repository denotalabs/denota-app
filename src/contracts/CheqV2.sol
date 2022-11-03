// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";

/* 
CRX: executes WTFC
Ownership (mint, transfer, ?burn)
Metadata (Cheq structs)
Deposit balances
ProtocolFees

Broker: conditionalizes WTFC
updates relevent internal variables

Essentially, tokens are double wrapped using this system:
    The token is wrapped in CRX as a Cheq (intrinsic properties), then wrapped inside it's broker (conditional functions)
    CRX is the chess board while brokers are the movement rules
*/


contract CRX is ERC721, Ownable {

    struct Cheq {
        uint256 amount;  // ? Broker can modify ?
        uint256 escrowed;  // Broker can modify [MOST VULNERABLE, corresponds to CRX deposits]
        IERC20 token;  // IMMUTABLE [not settable]
        address drawer; // IMMUTABLE [settable]
        address recipient; // IMMUTABLE [settable]
        ICheqBroker broker;  // IMMUTABLE [not settable]
    }
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => Cheq) public chequeInfo; // Cheq information
    mapping(address => mapping(IERC20 => uint256)) public deposits; // Total user deposits
    uint256 public totalSupply; // Total cheques created
    // mapping(ICheqBroker => bool) public resolverWhitelist;
    uint256 public protocolFee; // Fee in native token taken
    uint256 public protocolReserve; // Fee in native token taken
    // uint256 public writeFee;
    // uint256 public transferFee; // Fee in native token taken
    // uint256 public fundFee;
    // uint256 public cashFee;

    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposit(IERC20 indexed _token, address indexed to, uint256 amount);
    event WriteCheque(uint256 indexed tokenId, uint256 amount, uint256 escrowed, IERC20 token, address drawer, address indexed recipient, ICheqBroker indexed broker); 
    event Fund(uint256 indexed chequeID, uint256 amount);
    event Cash(address indexed bearer, uint256 indexed tokenId, uint256 cashingAmount);
    event SetProtocolFee(uint256 amount);
    event Withdraw(address indexed _address, uint256 amount);  // Protocol fees
    
    modifier onlyCheqBroker(uint256 chequeID){require(address(chequeInfo[chequeID].broker)==msg.sender, "Only Cheq's broker");_;}

    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor() ERC721("CheqProtocol", "CHEQ") {}

    function setFees(uint256 _protocolFee)
        external
        onlyOwner
    {
        protocolFee = _protocolFee;
        emit SetProtocolFee(_protocolFee);
    }
    function withdrawFees(uint256 _amount) external onlyOwner {
        require(protocolReserve >= _amount, "More than available");
        unchecked {
            protocolReserve -= _amount;
        }
        bool success = payable(address(this)).call(
            _msgSender(),
            _amount
        );
        require(success, "Transfer failed.");
        emit Withdraw(_msgSender(), _amount);
    }
    /*//////////////////////////////////////////////////////////////
                            USER DEPOSITS
    //////////////////////////////////////////////////////////////*/
    function _deposit(
        IERC20 _token,
        address from,
        uint256 _amount
    ) private {
        require(_amount > 0, "Zero deposit");
        require(_token.transferFrom(
            from,
            address(this),
            _amount
        ), "Transfer failed");
        deposits[from][_token] += _amount;
        emit Deposit(_token, from, _amount);
    }

    function deposit(IERC20 _token, uint256 _amount) public returns (bool) {  // make one external and use other in depositWrite()?
        _deposit(_token, _msgSender(), _amount);
        return true;
    }

    function deposit(
        address from,
        IERC20 _token,
        uint256 _amount
    ) public returns (bool) {
        _deposit(_token, from, _amount);
        return true;
    }

    /*//////////////////////////////////////////////////////////////
                          ERC-721 OVERRIDES
    //////////////////////////////////////////////////////////////*/
    function _feeOnTransfer(uint256 chequeID) private {  // Reduce escrowed amount on transfer
        // Cheq storage Cheq = chequeInfo[chequeID];
        // IERC20 _token = Cheq.token;
        // require(Cheq.amount >= protocolFee[_token], "too small for transfer");
        // unchecked {
        //     Cheq.amount = Cheq.amount - protocolFee[_token];
        // }
        // protocolReserve[_token] += protocolFee[_token];
    }  // Should this be in CRX?

    function transferFrom(
        address from,
        address to,
        uint256 chequeID
    ) public onlyCheqBroker(chequeID) virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), chequeID),
            "Transfer disallowed"
        );
        _feeOnTransfer(chequeID);  // TODO switch with yield
        _transfer(from, to, chequeID);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 chequeID,
        bytes memory data
    ) public onlyCheqBroker(chequeID) virtual override {
        require(
            _isApprovedOrOwner(_msgSender(), chequeID),
            "Transfer disallowed"
        );
        _feeOnTransfer(chequeID);  // TODO switch with yield
        _safeTransfer(from, to, chequeID, data);
    }

    /*//////////////////////////////////////////////////////////////
                        ERC-721 FUNCTION USAGE
    //////////////////////////////////////////////////////////////*/
    function _initCheque (
        address drawer,
        IERC20 _token,
        uint256 amount,
        uint256 escrowed,
        address recipient,
        ICheqBroker broker
        ) private pure returns(Cheq memory){
        return Cheq({
            drawer: drawer,
            recipient: recipient,
            token: _token,
            amount: amount,
            escrowed: escrowed, 
            broker: broker
        });
    }

    function writeCheque(
        address from,
        address recipient,
        IERC20 _token,
        uint256 amount,
        uint256 escrowed,
        ICheqBroker broker,
        address owner
    ) public 
        returns (uint256)
    {
        require(
            amount <= deposits[from][_token],
            "INSUF_BAL"
        );
        require(msg.sender==address(broker), "Only Broker");
        deposits[from][_token] -= amount;
        chequeInfo[totalSupply] = _initCheque(from, _token, amount, escrowed, recipient, broker);
        emit WriteCheque(totalSupply, amount, escrowed, _token, from, recipient, broker);
        _safeMint(owner, totalSupply);
        totalSupply += 1;
        return totalSupply-1;
    }

    function cashCheque(uint256 chequeID, address to, uint256 cashAmount) external onlyCheqBroker(chequeID) {
        Cheq storage Cheq = chequeInfo[chequeID]; 
        require(Cheq.escrowed>=cashAmount, "");
        Cheq.escrowed -= cashAmount;
        require(Cheq.token.transfer(to, cashAmount), "Transfer failed");
        emit Cash(to, chequeID, cashAmount);
    }

    function fundCheque(uint256 chequeID, uint256 amount) external onlyCheqBroker(chequeID) {
        // require(deposit(from, _token, _amount))
        require(amount <= deposits[from][_token], "INSUF_BAL");
        deposits[from][_token] -= amount;
        Cheq storage Cheq = chequeInfo[chequeID]; 
        Cheq.escrowed += amount;
        emit Fund(chequeID, amount);
    }

    function depositWrite(
        address from,
        IERC20 _token,
        uint256 amount,
        uint256 escrowed,
        address recipient,
        ICheqBroker broker, 
        address owner
        ) external
        returns (uint256){
        require(deposit(from, _token, amount), "deposit failed");
        return writeCheque(from, recipient, _token, amount, escrowed, broker, owner);
    }
    function chequeAmount(uint256 chequeId) external view returns (uint256) {
        return chequeInfo[chequeId].amount;
    }
    function chequeToken(uint256 chequeId) external view returns (IERC20) {
        return chequeInfo[chequeId].token;
    }
    function chequeDrawer(uint256 chequeId) external view returns (address) {
        return chequeInfo[chequeId].drawer;
    }
    function chequeRecipient(uint256 chequeId) external view returns (address) {
        return chequeInfo[chequeId].recipient;
    }
    function chequeEscrowed(uint256 chequeId) external view returns (uint256) {
        return chequeInfo[chequeId].escrowed;
    }
    function chequeBroker(uint256 chequeId) external view returns (ICheqBroker) {
        return chequeInfo[chequeId].broker;
    }
}


interface ICheqBroker {
    // IDK how ERC721 approval functions figure into this
    function isWriteable(address sender, IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) external view returns(bool);
    // Checks if caller can write the cheq [INTERFACE: broker] (isWriteable)
    // Checks if caller has enough balance [Cheq]
    //// Checks if recipient/Cheq allows this broker [Cheq]
    // Pays auditor [INTERFACE: auditor]
    // Deducts user balance [Cheq]
    // Initializes chequeInfo [Cheq]
    // Emits WriteCheque [Cheq]
    // Mints Cheq [Cheq]
    // Calls onWrite() [INTERFACE]
    // Increments totalSupply [Cheq]
    // Returns chequeID (totalsupply) [Cheq]
    // PROTOCOL FEE [Cheq]
    ///// function Write(uint256 chequeID, address sender, IERC20 _token, uint256 amount, uint256 escrowed, address recipient) external returns(bool);
    // Updates the broker contract's variables
    
    function isTransferable(uint256 chequeID, address caller) external view returns(bool);
    // Checks if caller isOwner 
    // Transfers
    // PROTOCOL FEE [Cheq]
    //// function transfer(uint256 chequeID, address caller) external view;

    function fundable(uint256 chequeID, address caller, uint256 amount) external view returns(uint256);
    // Checks if the caller has enough in crx.deposits[caller][cheq.token]
    
    function cashable(uint256 chequeID, address caller) external view returns(uint256);  // How much can be cashed
    // Checks if caller is the owner [INTERFACE: broker]
    // Checks if is cashable [INTERFACE: broker]
    // Sets as cashed [CHEQ OR INTERFACE?]
    // Transfers the cashing amount [Cheq]
    // Emits Cash event [Cheq]
    // PROTOCOL FEE [Cheq]
    // AUDITOR FEE [INTERFACE: auditor]
    //// THIS MIGHT NOT NEED TO BE IN [CHEQ] SINCE IT ONLY AFFECTS CASHABLE
    // function isVoidable(uint256 chequeID, address caller) external returns(bool);
    // Checks if caller is auditor [INTERFACE]
    // Checks if check is voidable by auditor []
    // Sets cash status []
    // Pays auditor []
    // Increments balance back to drawer
    // Emits Void event [Cheq]
    // PROTOCOL FEE [Cheq]
    // function cash() external returns (bool);
    function status(uint256 chequeID) external view returns(string memory);  // TODO Could this be used maliciously?
    // 0:Pending, 1:Ready, 2:Settled, 3:Rejected  
    // Refunded/voided, Spited, Disputing, Frozen, Burnt, Mature
}


interface IAuditFeeResolver {  // Execute fee or just return it?
    function onWrite() external returns(uint256);
    function onCash() external returns(uint256);
    function onVoid() external returns(uint256);
    function onTransfer() external returns(uint256);
}

contract SelfSignTimeLock is ICheqBroker {  
    CRX public crx;
    // struct CheqWrapper {
    //     address auditor;
    //     uint256 created;
    //     uint256 inspectionDuration;
    //     bool isVoided;
    // }
    // mapping(uint256 => CheqWrapper) public cheqWrappers;
    mapping(uint256 => address) public cheqAuditor;
    mapping(uint256 => uint256) public cheqCreated;
    mapping(uint256 => uint256) public cheqInspectionPeriod;
    mapping(uint256 => bool) public cheqVoided;
    // mapping(address => bool) public acceptsBroker;  // Allow users to opt-in?

    constructor(CRX _crx){
        crx = _crx;
    }
    function isWriteable(address, IERC20, uint256, uint256, address, address) public pure returns(bool) { 
        // return acceptsBroker[sender] && acceptsBroker[recipient] && acceptsBroker[owner];  // See if writer has enough deposit on Cheq or let Cheq do that?
        return true;
    }

    function writeCheque(
        IERC20 _token,
        uint256 amount,
        uint256 escrowed,
        address recipient,
        address owner,
        address auditor,
        uint256 inspectionPeriod
        ) external returns(uint256){
        // require(isWriteable(msg.sender, _token, amount, escrowed, recipient, owner), "Not writeable");  // Customary
        uint256 cheqId = crx.writeCheque(msg.sender, recipient, _token, amount, escrowed, this, owner);  // TODO Rewrite arg order to a standard form across write_()
        cheqCreated[cheqId] = block.timestamp;
        cheqAuditor[cheqId] = auditor;
        cheqInspectionPeriod[cheqId] = inspectionPeriod;
        // cheqWrappers[cheqId] = CheqWrapper({auditor: auditor, created: block.timestamp, inspectionDuration: inspectionPeriod, isVoided:false});
        return cheqId;
    }

    function isTransferable(uint256 chequeID, address caller) public view returns(bool){
        // cheq._isApprovedOrOwner(caller, chequeID);  // Need to find out if this is true and return it
        return crx.ownerOf(chequeID)==caller;
    }

    function fundable(uint256 chequeID, address caller, uint256 amount) public view returns(uint256) {
        return false;
    }

    function cashable(uint256 chequeID, address caller) public view returns(uint256) {  // Let anyone see what's cashable, ALSO 
        if (block.timestamp >= cheqCreated[chequeID]+cheqInspectionPeriod[chequeID] 
            || crx.ownerOf(chequeID)!=caller 
            || cheqVoided[chequeID]){
            return 0;
        } else{
            return crx.chequeEscrowed(chequeID);
        }
    }

    function cashCheque(uint256 chequeID) external {
        // require(cheq.ownerOf(chequeID)==msg.sender, "Non-owner");  // Keep this check to let user know they don't own it?
        uint256 cashingAmount = cashable(chequeID, msg.sender);
        require(cashingAmount>0, "Not cashable");
        crx.cashCheque(chequeID, msg.sender, cashingAmount);
    }
    
    function voidCheque(uint256 chequeID) external {
        require(cheqAuditor[chequeID]==msg.sender, "Only auditor");
        cheqVoided[chequeID] = true;
        crx.cashCheque(chequeID, crx.chequeDrawer(chequeID), crx.chequeEscrowed(chequeID));  // Return escrow to drawer
    }
    function status(uint256 chequeID, address caller) public view returns(string memory){
        if(cashable(chequeID, caller) != 0){
            return "mature";
        } else if(cheqVoided[chequeID]){
            return "voided";
        } else {
            return "pending";
        }
    }
}

contract HandshakeTimeLock is ICheqBroker {
    CRX public crx;

    constructor(CRX _crx){
        crx = _crx;
    }

    mapping(address => mapping(address => bool)) public userAuditor; // Whether User accepts Auditor
    mapping(address => mapping(address => bool)) public auditorUser; // Whether Auditor accepts User  
    mapping(uint256 => uint256) public cheqCreated;
    mapping(uint256 => uint256) public cheqInspectionPeriod;
    mapping(uint256 => bool) public cheqVoided; 


    function isWriteable(address sender, IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) public pure returns(bool) { 
        return acceptsBroker[sender] && acceptsBroker[recipient] && acceptsBroker[owner];  // See if writer has enough deposit on Cheq or let Cheq do that?
    }

    function writeCheque(
        IERC20 _token,
        uint256 amount,
        uint256 escrowed,
        address recipient,
        address owner,
        address auditor,
        uint256 inspectionPeriod
        ) external returns(uint256){
        require(isWriteable(msg.sender, _token, amount, escrowed, recipient, owner), "Not writeable");  // Customary
        uint256 cheqId = crx.writeCheque(msg.sender, recipient, _token, amount, escrowed, this, owner);  // TODO Rewrite arg order to a standard form across write_()
        cheqCreated[cheqId] = block.timestamp;
        cheqAuditor[cheqId] = auditor;
        cheqInspectionPeriod[cheqId] = inspectionPeriod;
        // cheqWrappers[cheqId] = CheqWrapper({auditor: auditor, created: block.timestamp, inspectionDuration: inspectionPeriod, isVoided:false});
        return cheqId;
    }

    function isTransferable(uint256 chequeID, address caller) public view returns(bool){
        // cheq._isApprovedOrOwner(caller, chequeID);  // Need to find out if this is true and return it
        return crx.ownerOf(chequeID)==caller;
    }

    function fundable(uint256 chequeID, address caller, uint256 amount) public view returns(uint256) {
        return false;
    }

    function cashable(uint256 chequeID, address caller) public view returns(uint256) {  // Let anyone see what's cashable, ALSO 
        if (block.timestamp >= cheqCreated[chequeID]+cheqInspectionPeriod[chequeID] 
            || crx.ownerOf(chequeID)!=caller 
            || cheqVoided[chequeID]){
            return 0;
        } else{
            return crx.chequeEscrowed(chequeID);
        }
    }

    function cashCheque(uint256 chequeID) external {
        // require(cheq.ownerOf(chequeID)==msg.sender, "Non-owner");  // Keep this check to let user know they don't own it?
        uint256 cashingAmount = cashable(chequeID, msg.sender);
        require(cashingAmount>0, "Not cashable");
        crx.cashCheque(chequeID, msg.sender, cashingAmount);
    }
    
    function voidCheque(uint256 chequeID) external {
        require(cheqAuditor[chequeID]==msg.sender, "Only auditor");
        cheqVoided[chequeID] = true;
        crx.cashCheque(chequeID, crx.chequeDrawer(chequeID), crx.chequeEscrowed(chequeID));  // Return escrow to drawer
    }
    function status(uint256 chequeID, address caller) public view returns(string memory){
        if(cashable(chequeID, caller) != 0){
            return "mature";
        } else if(cheqVoided[chequeID]){
            return "voided";
        } else {
            return "pending";
        }
    }
}