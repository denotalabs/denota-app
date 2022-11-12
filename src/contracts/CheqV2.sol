// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";

/* 
CRX: executes WTFC
Ownership (mint, transfer, ?burn)
Deposit balances5
Approvals
Metadata (Cheq structs)
ProtocolFees

Broker: conditionalizes WTFCAD
updates relevent internal variables

Essentially, tokens are double wrapped using this system:
    The token is wrapped in CRX as a Cheq (intrinsic properties), then wrapped by it's broker (conditional functions)
    CRX is the chess board while brokers are the movement rules

TODO: Add NFT forwarding functions to broker (including approvals) (allow approvals called to crx or need to go through broker??)
TODO: How to add additional parameters to ICheqBroker for broker's execution functions? IwriteCheq() + inspection period, inspector, voider, oracle, etc.. Maybe not include writeCheq as part of interface??
TODO: Let the broker handle using write or depositWrite()? Or broker can use switch to call write() || depositWrite() depending on funds?
TODO: have depositWrite() in crx or brokers? Would broker using deposit() update crx.deposits before write() if in same broker call?
TODO: Could status() be used maliciously?
TODO: Allow changing of tokenURI by broker
TODO: Allow changing of drawer or recipient???
    WHY WOULD THE INITIAL RECIPIENT NOT BE THE OWNER??
    WHY WOULD THE DRAWER NOT BE THE EOA CALLING WRITECHEQ()??
TODO: Rewrite arg order to a standard form across write_()

TODO: Decide deposits tracking location
    1. Each module deposits on user's behalf 
        * Module balances are quarantined
        * Modules can decide how to distribute across users (depositing on behalf of others)
    2. Users give approvals to modules
        * Users can deposit large here and approve on a loop
        * 
TODO: Will brokers be whitelisted by CRX, by user, or completely permissionless?
*/


// Brokers whitelisted by CRX admins, deposits are on crx at user level, no user deposit approvals to each broker needed
contract CRX is ERC721, Ownable {

    struct Cheq {
        uint256 amount;  // ? Broker can modify ?
        uint256 escrowed;  // Broker can modify [MOST VULNERABLE, corresponds to CRX deposits]
        IERC20 token;  // IMMUTABLE [not settable]
        address drawer; // IMMUTABLE [settable]  !INTENDED DRAWER
        address recipient; // IMMUTABLE [settable]  !INTENDED ?FIRST OWNER
        ICheqBroker broker;  // IMMUTABLE [not settable]
    }
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => Cheq) public cheqInfo; // Cheq information
    mapping(address => mapping(IERC20 => uint256)) public deposits; // Total user deposits
    mapping(ICheqBroker => bool) public brokerWhitelist; // Total user deposits
    uint256 public totalSupply; // Total cheques created

    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposited(IERC20 indexed _token, address indexed to, uint256 amount);
    event Written(uint256 indexed tokenId, uint256 amount, uint256 escrowed, IERC20 token, address drawer, address indexed recipient, ICheqBroker indexed broker); 
    event Funded(uint256 indexed cheqId, address from, uint256 amount);
    event Cashed(address indexed bearer, uint256 indexed tokenId, uint256 cashingAmount);
    event BrokerWhitelisted(ICheqBroker indexed _address, bool isAccepted);
    
    modifier onlyCheqBroker(uint256 cheqId){require(address(cheqInfo[cheqId].broker)==msg.sender, "Only Cheq's broker");_;}
    modifier onlyWhitelist(ICheqBroker broker){require(brokerWhitelist[broker], "Only whitelisted broker");_;}

    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor() ERC721("CheqProtocol", "CHEQ") {}

    function whitelistBroker(ICheqBroker broker, bool isAccepted) external onlyOwner {
        brokerWhitelist[broker] = isAccepted;
        emit BrokerWhitelisted(broker, isAccepted);
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
        emit Deposited(_token, from, _amount);
    }

    function deposit(IERC20 _token, uint256 _amount) public onlyOwner returns (bool) {  // make one external and use other in depositWrite()?
        _deposit(_token, _msgSender(), _amount);
        return true;
    }

    function deposit(  // Deposit on someone's behalf
        address from,
        IERC20 _token,
        uint256 _amount
    ) public onlyOwner returns (bool) {
        _deposit(_token, from, _amount);
        return true;
    }

    /*//////////////////////////////////////////////////////////////
                        ERC-721 FUNCTION USAGE
    //////////////////////////////////////////////////////////////*/
    function write(
        address from,
        address recipient,
        IERC20 _token,
        uint256 amount,
        uint256 escrowed,
        address owner
    ) public onlyWhitelist(_msgSender())
        returns (uint256)
    {
        require(
            amount <= deposits[from][_token],  // Trust broker to not take from arbitrary user balance (whitelist)
            "INSUF_BAL"
        );
        deposits[from][_token] -= amount;
        cheqInfo[totalSupply] = Cheq({
            drawer: from,
            recipient: recipient,
            token: _token,
            amount: amount,
            escrowed: escrowed, 
            broker: _msgSender()
        });
        _safeMint(owner, totalSupply);
        emit Written(totalSupply, amount, escrowed, _token, from, recipient, _msgSender());
        totalSupply += 1;
        return totalSupply-1;
    }

    function transferFrom(
        address from,
        address to,
        uint256 cheqId
    ) public onlyCheqBroker(cheqId) virtual override {
        _transfer(from, to, cheqId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 cheqId,
        bytes memory data
    ) public onlyCheqBroker(cheqId) virtual override {
        _safeTransfer(from, to, cheqId, data);
    }

    function fund(uint256 cheqId, address from, uint256 amount) external onlyCheqBroker(cheqId) {
        Cheq storage cheq = cheqInfo[cheqId]; 
        IERC20 _token = cheq.token;
        require(amount <= deposits[from][_token], "INSUF_BAL");
        unchecked {deposits[from][_token] -= amount;}
        cheq.escrowed += amount;
        emit Funded(cheqId, from, amount);
    }

    function cash(uint256 cheqId, address to, uint256 cashAmount) external onlyCheqBroker(cheqId) {
        Cheq storage cheq = cheqInfo[cheqId]; 
        require(cheq.escrowed>=cashAmount, "Can't cash more than available");
        unchecked {cheq.escrowed -= cashAmount;}
        require(cheq.token.transfer(to, cashAmount), "Transfer failed");
        emit Cashed(to, cheqId, cashAmount);
    }

    function cheqAmount(uint256 cheqId) external view returns (uint256) {
        return cheqInfo[cheqId].amount;
    }
    function cheqToken(uint256 cheqId) external view returns (IERC20) {
        return cheqInfo[cheqId].token;
    }
    function cheqDrawer(uint256 cheqId) external view returns (address) {
        return cheqInfo[cheqId].drawer;
    }
    function cheqRecipient(uint256 cheqId) external view returns (address) {
        return cheqInfo[cheqId].recipient;
    }
    function cheqEscrowed(uint256 cheqId) external view returns (uint256) {
        return cheqInfo[cheqId].escrowed;
    }
    function cheqBroker(uint256 cheqId) external view returns (ICheqBroker) {
        return cheqInfo[cheqId].broker;
    }
}


interface ICheqBroker {
    //// function isWriteable(address sender, IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) external view returns(bool);
    //// function writeCheq(IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) external returns(uint256);
    // Checks if CRX allows this broker [CRX]
    // Checks if caller can write the cheq [INTERFACE: broker] (isWriteable)
    // Checks if caller has enough balance [CRX]
    // Pays auditor [INTERFACE: auditor]
    // Deducts user balance [CRX]
    // Initializes cheqInfo [CRX]
    // Emits Written [CRX]
    // Mints Cheq [CRX]
    // Increments totalSupply [CRX]
    // Returns cheqId [CRX]
    // Updates the broker contract's variables
    
    function isTransferable(uint256 cheqId, address caller, address to) external view returns(bool);
    function transferCheq(uint256 cheqId, address to) external;

    function fundable(uint256 cheqId, address caller, uint256 amount) external view returns(uint256);
    function fundCheq(uint256 cheqId, uint256 amount) external;
    
    function cashable(uint256 cheqId, address caller) external view returns(uint256);  // How much can be cashed
    function cashCheq(uint256 cheqId, uint256 amount) external;
    // Checks if caller is the owner [INTERFACE: broker]
    // Checks if is cashable [INTERFACE: broker]
    // Sets as cashed [CHEQ OR INTERFACE?]
    // Transfers the cashing amount [Cheq]
    // Emits Cash event [Cheq]
    // Checks if caller is auditor [INTERFACE]
    // Cashes balance back to drawer
    // function cash() external returns (bool);
}

contract SelfSignTimeLock is ICheqBroker {  
    CRX public cheq;
    mapping(uint256 => address) public cheqFunder;
    mapping(uint256 => address) public cheqReceiver;
    mapping(uint256 => uint256) public cheqCreated;
    mapping(uint256 => uint256) public cheqInspectionPeriod;
    mapping(uint256 => bool) public cheqVoided;

    constructor(CRX _cheq){
        cheq = _cheq;
    }
    function isWriteable(address, IERC20, uint256, uint256, address, address) public pure returns(bool) { 
        return true;
    }
    // function writeCheq(IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) public returns(uint256){
    //     return crx.write(msg.sender, recipient, _token, amount, escrowed, this, owner);
    // }
    function writeCheq(
        IERC20 _token,
        uint256 amount,
        uint256 escrowed,
        address recipient,
        address owner,
        uint256 inspectionPeriod
        ) external returns(uint256){
        uint256 cheqId = cheq.write(msg.sender, recipient, _token, amount, escrowed, this, owner);
        cheqCreated[cheqId] = block.timestamp;
        cheqInspectionPeriod[cheqId] = inspectionPeriod;
        cheqFunder[cheqId] = msg.sender;
        return cheqId;
    }

    // function writeInvoice(
    //     IERC20 _token,
    //     uint256 amount,
    //     uint256 escrowed,
    //     address funder,
    //     address owner,
    //     uint256 inspectionPeriod
    //     ) external returns(uint256){
    //     // require(isWriteable(msg.sender, _token, amount, escrowed, recipient, owner), "Not writeable");  // Customary
    //     uint256 cheqId = crx.write(funder,  msg.sender, _token, amount, 0, this, msg.sender);  // TODO Rewrite arg order to a standard form across write_()
    //     cheqCreated[cheqId] = block.timestamp;
    //     cheqReceiver[cheqId] = msg.sender;
    //     cheqFunder[cheqId] = funder;
    //     cheqInspectionPeriod[cheqId] = inspectionPeriod;
    //     return cheqId;
    // }

    function isTransferable(uint256 cheqId, address caller, address to) public view returns(bool){
        return cheq.ownerOf(cheqId)==caller;
    }

    function transferCheq(uint256 cheqId, address to) public {
        require(isTransferable(cheqId, msg.sender, to));
        cheq.transferFrom(msg.sender, to, cheqId);
    }

    function fundable(uint256 cheqId, address, uint256) public view returns(uint256) {
        uint currentEscrow = cheq.cheqEscrowed(cheqId);
        if (currentEscrow == 0) {
            return cheq.cheqAmount(cheqId);
        } else {
            return 0;
        }
    }
    function fundCheq(uint256 cheqId, uint256 amount) public {
        //require(cheqFunder[cheqId]==msg.sender, "Not fundable"); Let random people fund cheqs?
        uint256 fundableAmount = fundable(cheqId, msg.sender, amount);
        require(fundableAmount > 0, "Not fundable"); 
        cheq.fund(cheqId, msg.sender, fundableAmount);
    }

    function cashable(uint256 cheqId, address caller) public view returns(uint256) {  // Let anyone see what's cashable, ALSO 
        if (block.timestamp >= cheqCreated[cheqId]+cheqInspectionPeriod[cheqId] 
            || cheq.ownerOf(cheqId)!=caller 
            || cheqVoided[cheqId]){
            return 0;
        } else{
            return cheq.cheqEscrowed(cheqId);
        }
    }
    function cashCheq(uint256 cheqId, uint256 amount) external {
        // require(cheq.ownerOf(cheqId)==msg.sender, "Non-owner");  // Keep this check to let user know they don't own it?
        uint256 cashingAmount = cashable(cheqId, msg.sender);
        require(cashingAmount>0, "Not cashable");
        cheq.cash(cheqId, msg.sender, cashingAmount);
    }
    
    function voidCheq(uint256 cheqId) external {
        require(cheqFunder[cheqId]==msg.sender, "Only funder");
        cheqVoided[cheqId] = true;
        cheq.cash(cheqId, crx.cheqDrawer(cheqId), cheq.cheqEscrowed(cheqId));  // Return escrow to drawer
    }
    function status(uint256 cheqId, address caller) public view returns(string memory){
        if(cashable(cheqId, caller) != 0){
            return "mature";
        } else if(cheqVoided[cheqId]){
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
    // mapping(address => mapping(address => address)) public acceptedCombos;  // Whether this combination of user-auditor-user exists (not address(0)). ASSUMES ONLY MANY-1 RELATIONSHIP BETWEEN USERS AND AUDITOR
    mapping(uint256 => address) public cheqAuditor;
    mapping(uint256 => uint256) public cheqCreated;
    mapping(uint256 => uint256) public cheqInspectionPeriod;
    mapping(uint256 => bool) public cheqVoided; 


    function isWriteable(
        address sender, 
        IERC20 _token, 
        uint256 amount, 
        uint256 escrowed, 
        address recipient, 
        address owner, 
        address auditor, 
        uint256 inspectionPeriod
        ) public view returns(bool) { 
        return userAuditor[auditor] && auditorUser[sender];
    }

    function writeCheq(
        IERC20 _token,
        uint256 amount,
        uint256 escrowed,
        address recipient,
        address owner,
        address auditor,
        uint256 inspectionPeriod
        ) external returns(uint256){
        require(isWriteable(msg.sender, _token, amount, escrowed, recipient, owner), "Not writeable"); 
        uint256 cheqId = crx.write(msg.sender, recipient, _token, amount, escrowed, this, owner);
        cheqCreated[cheqId] = block.timestamp;
        cheqAuditor[cheqId] = auditor;
        cheqInspectionPeriod[cheqId] = inspectionPeriod;
        return cheqId;
    }

    function isTransferable(uint256 cheqId, address caller) public view returns(bool){
        // cheq._isApprovedOrOwner(caller, cheqId);  // Need to find out if this is true and return it
        return crx.ownerOf(cheqId)==caller;
    }

    function fundable(uint256 cheqId, address caller, uint256 amount) public view returns(uint256) {
        return 0;
    }

    function cashable(uint256 cheqId, address caller) public view returns(uint256) {  // Let anyone see what's cashable, ALSO 
        if (block.timestamp >= cheqCreated[cheqId]+cheqInspectionPeriod[cheqId] 
            || crx.ownerOf(cheqId)!=caller 
            || cheqVoided[cheqId]){
            return 0;
        } else{
            return crx.cheqEscrowed(cheqId);
        }
    }

    function cashCheq(uint256 cheqId) external {
        // require(cheq.ownerOf(cheqId)==msg.sender, "Non-owner");  // Keep this check to let user know they don't own it?
        uint256 cashingAmount = cashable(cheqId, msg.sender);
        require(cashingAmount>0, "Not cashable");
        crx.cash(cheqId, msg.sender, cashingAmount);
    }
    
    function voidCheq(uint256 cheqId) external {
        require(cheqAuditor[cheqId]==msg.sender, "Only auditor");
        cheqVoided[cheqId] = true;
        crx.cash(cheqId, crx.cheqDrawer(cheqId), crx.cheqEscrowed(cheqId));  // Return escrow to drawer
    }
    function status(uint256 cheqId, address caller) public view returns(string memory){
        if(cashable(cheqId, caller) != 0){
            return "mature";
        } else if(cheqVoided[cheqId]){
            return "voided";
        } else {
            return "pending";
        }
    }
}

contract Invoice is ICheqBroker {
    CRX public crx;
    mapping(uint256 => uint256) public cheqWorkDuration;
    mapping(uint256 => uint256) public cheqFundedTimestamp;

    function isWriteable(address sender, IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) public view returns(bool){
        return true;
    }

    function writeCheq(
        IERC20 _token,
        uint256 amount,
        address recipient,
        uint256 duration
        ) external returns(uint256){
        require(isWriteable(msg.sender, _token, amount, 0, recipient, msg.sender));
        uint256 cheqId = crx.write(msg.sender, recipient, _token, amount, 0, this, msg.sender);
        cheqWorkDuration[cheqId] = duration;
        return cheqId;
    }
    
    function isTransferable(uint256 cheqId, address caller) external view returns(bool){
        return true;
    }

    function fundable(uint256 cheqId, address caller, uint256 amount) external view returns(uint256){
        if (caller == crx.cheqRecipient(cheqId)) {
            return crx.cheqAmount(cheqId);  // Only recipeint (employer) can fund cheq
        } else {
            return 0;
        }
    }

    function fundCheq(uint256 cheqId, uint256 amount) public {
        uint256 fundableAmount = fundable(cheqId, msg.sender, amount);
        require(fundableAmount > 0, "Not fundable"); 
        crx.fund(cheqId, msg.sender, fundableAmount);
    }
    
    function cashable(uint256 cheqId, address caller) external view returns(uint256){  
        // [           Working period (starts on fund, can be unfunded)                |                 ...]
        // Allow cheq funder to rescind funding before work period has elapsed
        if (crx.cheqDrawer(cheqId) == caller && cheqFundedTimestamp[cheqId]>0) {
            return block.timestamp >= cheqFundedTimestamp[cheqId]+cheqWorkDuration[cheqId];
        } else if () {
            return true;
        } else {
            return false;
        }
    }

    function cashCheq(uint256 cheqId) external {

    }

    function status(uint256 cheqId, address caller) external view returns(string memory){

    }

}


// require(
//     _isApprovedOrOwner(_msgSender(), cheqId),
//     "Transfer disallowed"
// );

    // function depositWrite(
    //     address from,
    //     IERC20 _token,
    //     uint256 amount,
    //     uint256 escrowed,
    //     address recipient,
    //     address owner
    //     ) external
    //     returns (uint256){
    //     require(deposit(from, _token, amount), "deposit failed");
    //     return write(from, recipient, _token, amount, escrowed, owner);

    // }