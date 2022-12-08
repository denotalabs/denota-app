// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";

// TODO Ensure Write/Deposit supports ERC20 interface
// TODO Make all functions external
// TODO Allow escrowing of NFTs
// TODO Make sure OpenSea integration works
//// See how OS tracks metadata
// TODO Enable URI editing
//// have tokenURI() call to cheqBroker tokenURI (which sets its baseURI and the token's URI)
// TODO Make modules ERC721 compatible?
// TODO Allow brokers to modify deposits freely?? May allow yield from their end
contract CRX is ERC721, Ownable {

    struct Cheq {
        IERC20 token;  // IMMUTABLE [not settable]
        uint256 amount;  // ? Broker can modify ?
        uint256 escrowed;  // Broker can modify [MOST VULNERABLE, corresponds to CRX deposits]
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
    uint256 public totalSupply; // Total cheqs created
    // uint256 public chainId;

    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposited(IERC20 indexed token, address indexed to, uint256 amount);
    event Written(uint256 indexed cheqId, IERC20 token, uint256 amount, uint256 escrowed, address indexed drawer, address recipient, ICheqBroker indexed broker, address owner); 
    event Funded(uint256 indexed cheqId, address indexed from, uint256 amount);
    event Cashed(uint256 indexed cheqId, address indexed to, uint256 amount);
    event BrokerWhitelisted(ICheqBroker indexed broker, bool isAccepted);
    
    modifier onlyCheqBroker(uint256 cheqId){require(address(cheqInfo[cheqId].broker) == _msgSender(), "Only cheq's broker");_;}
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
        IERC20 token,
        address to,
        uint256 amount
    ) private {
        // require(amount > 0, "Zero deposit");  // Allow zero deposits
        require(token.transferFrom(
            _msgSender(),
            address(this),
            amount
        ), "Transfer failed");
        deposits[to][token] += amount;
        emit Deposited(token, to, amount);
    }

    function deposit(IERC20 _token, uint256 _amount) public returns (bool) {  // make one external and use other in depositWrite()?
        _deposit(_token, _msgSender(), _amount);
        return true;
    }

    function deposit(
        address to,
        IERC20 token,
        uint256 amount
    ) public returns (bool) {
        _deposit(token, to, amount);
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
        uint256 escrow,
        address owner
    ) public onlyWhitelist(ICheqBroker(_msgSender()))
        returns (uint256)
    {
        require(
            escrow <= deposits[from][_token],  // Trust broker to not take from arbitrary user balance (whitelist)
            "INSUF_BAL"
        );
        deposits[from][_token] -= escrow;  // Deduct user balance
        cheqInfo[totalSupply] = Cheq({
            token: _token,
            amount: amount,
            escrowed: escrow, 
            drawer: from,
            recipient: recipient,
            broker: ICheqBroker(_msgSender())
        });
        _safeMint(owner, totalSupply);
        emit Written(totalSupply, _token, amount, escrow, from, recipient, ICheqBroker(_msgSender()), owner);
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

    function fund(uint256 cheqId, address from, uint256 amount) external onlyCheqBroker(cheqId) {  // `From` can originate from anyone, broker specifies whose balance it is removing from though
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
        emit Cashed(cheqId, to, cashAmount);
    }
    function _isApprovedOrOwner(address spender, uint256 cheqId) internal view override returns (bool) {
        return spender == address(cheqInfo[cheqId].broker);  // delegate checks/functionality to cheq broker
    }

    // function tokenURI(uint256 cheqId) public view virtual override returns (string memory) {
    //     return ICheqBroker(cheqInfo[cheqId].broker).tokenURI(cheqId);
    // }
    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
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
    
    function cashable(uint256 cheqId, address caller, uint256 amount) external view returns(uint256);  // How much can be cashed
    function cashCheq(uint256 cheqId, uint256 amount) external;
    // function tokenURI(uint256 tokenId) external view returns (string memory);
    // baseURI
    // _setTokenURI
    // _setBaseURI
    
    // Checks if caller is the owner [INTERFACE: broker]
    // Checks if is cashable [INTERFACE: broker]
    // Transfers the cashing amount [Cheq]
    // Emits Cash event [Cheq]
    // Checks if caller is auditor [INTERFACE]
    // Cashes balance back to drawer
    // function cash() external returns (bool);
}

contract SelfSignTimeLock is ICheqBroker, Ownable {  
    CRX public cheq;
    mapping(uint256 => address) public cheqFunder;
    mapping(uint256 => address) public cheqReceiver;
    mapping(uint256 => uint256) public cheqCreated;
    mapping(uint256 => uint256) public cheqInspectionPeriod;
    mapping(uint256 => bool) public isEarlyReleased;  // TODO: add early release
    mapping(IERC20 => bool) public tokenWhitelist;
    string private _baseURI;

    function whitelistToken(IERC20 token, bool isAccepted) public onlyOwner {
        tokenWhitelist[token] = isAccepted;
    }
    constructor(CRX _cheq){
        cheq = _cheq;
    }
    function isWriteable(address, IERC20, uint256, uint256, address, address) public pure returns(bool) { 
        return true;
    }

    function writeCheq(   // Integer overflows if block.timestamp+inspectionPeriod too large, solidity 0.8 reverts
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address recipient,
        uint256 inspectionPeriod
        ) public returns(uint256){  // If no escrow its an invoice
        require(recipient != msg.sender, "Can't self send");
        if (escrow == 0){  // Invoice
            uint256 cheqId = cheq.write(msg.sender, recipient, _token, amount, escrow, msg.sender);  // Sender is owner
            cheqCreated[cheqId] = block.timestamp;
            cheqInspectionPeriod[cheqId] = inspectionPeriod;
            cheqFunder[cheqId] = recipient;
            cheqReceiver[cheqId] = msg.sender;
            return cheqId;
        } else {  // Cheq
            require(cheq.deposits(msg.sender, _token) + _token.balanceOf(msg.sender) >= amount, "Cant send partially funded cheq");
            uint256 cheqId = cheq.write(msg.sender, recipient, _token, amount, escrow, recipient);
            cheqCreated[cheqId] = block.timestamp;
            cheqInspectionPeriod[cheqId] = inspectionPeriod;
            cheqFunder[cheqId] = msg.sender;
            cheqReceiver[cheqId] = recipient;
            return cheqId;
        }
    }

    function isTransferable(uint256 cheqId, address caller, address to) public view returns(bool){
        return cheq.ownerOf(cheqId)==caller;  // Would caller ever be addres(0)
    }

    function transferCheq(uint256 cheqId, address to) public {
        require(isTransferable(cheqId, msg.sender, to), "Not owner");
        cheq.transferFrom(msg.sender, to, cheqId);
    }

    function fundable(uint256 cheqId, address, uint256) public view returns(uint256) {
        if (cheq.cheqEscrowed(cheqId) == 0) {  // Invoice  // && caller == cheqReciever[cheqId]
            return cheq.cheqAmount(cheqId);
        } else {  // Cheq
            return 0;
        }
    }

    function fundCheq(uint256 cheqId, uint256 amount) public {  
        uint256 fundableAmount = fundable(cheqId, msg.sender, amount);
        require(fundableAmount > 0, "Not fundable"); 
        require(fundableAmount == amount, "Cant fund this amount");
        cheq.fund(cheqId, msg.sender, amount);
        cheqCreated[cheqId] = block.timestamp;  // BUG: can update with 0 at any time- If it can be funded its an invoice, reset creation date for job start
    }

    // BUG what if funder doesnt fund the invoice for too long??
    function cashable(uint256 cheqId, address caller, uint256 amount) public view returns(uint256) {  // Invoice funder can cash before period, cheq writer can cash before period
        // Chargeback case
        if (cheqFunder[cheqId] == caller && (block.timestamp < cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])){  // Funding party can rescind before the inspection period elapses
            return cheq.cheqEscrowed(cheqId);
        } else if (cheq.ownerOf(cheqId) == caller && (block.timestamp >= cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])){  // Receiving/Owning party can cash after inspection period
            return cheq.cheqEscrowed(cheqId);
        } else if (isEarlyReleased[cheqId]){
            return cheq.cheqEscrowed(cheqId);
        } else {
            return 0;
        }
    }

    function cashCheq(uint256 cheqId, uint256 amount) public {  // TODO: allow anyone to cash for someone?
        uint256 cashableAmount = cashable(cheqId, msg.sender, amount);
        require(cashableAmount == amount, "Cant cash this amount");
        cheq.cash(cheqId, msg.sender, amount);
    }

    function cashCheq(uint256 cheqId) public {
        uint256 cashableAmount = cashable(cheqId, msg.sender, 0);
        cashCheq(cheqId, cashableAmount);
    }

    function isApprovable(uint256 cheqId, address caller, address to) public view returns(bool){
        return cheq.ownerOf(cheqId)==caller;  // 
    }
    
    function approve(address to, uint256 cheqId) public {
        require(isApprovable(cheqId, msg.sender, to), "");
        cheq.approve(to, cheqId);
    }

    function earlyRelease(uint256 cheqId, bool isReleased) public {
        require(cheqFunder[cheqId]==msg.sender, "only funder can release early");
        isEarlyReleased[cheqId] = isReleased;

    }

    // function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    //     _exists(tokenId);

    //     // string memory _tokenURI = _tokenURIs[tokenId];
    //     string memory base = _baseURI();

    //     // If there is no base URI, return the token URI.
    //     if (bytes(base).length == 0) {
    //         return string(tokenId);
    //     }
    //     // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
    //     if (bytes(_tokenURI).length > 0) {
    //         return string(abi.encodePacked(base, _tokenURI));
    //     }

    //     return super.tokenURI(tokenId);
    // }

    // function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
    //     require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
    //     _tokenURIs[tokenId] = _tokenURI;
    // }

    // function _setBaseURI(string calldata __baseURI) public {
    //     _baseURI = __baseURI;
    // }

    // function baseURI() public view returns (string memory){
    //     return _baseURI;
    // }
}

// contract HandshakeTimeLock is ICheqBroker {
//     CRX public crx;

//     constructor(CRX _crx){
//         crx = _crx;
//     }

//     mapping(address => mapping(address => bool)) public userAuditor; // Whether User accepts Auditor
//     mapping(address => mapping(address => bool)) public auditorUser; // Whether Auditor accepts User  
//     // mapping(address => mapping(address => address)) public acceptedCombos;  // Whether this combination of user-auditor-user exists (not address(0)). ASSUMES ONLY MANY-1 RELATIONSHIP BETWEEN USERS AND AUDITOR
//     mapping(uint256 => address) public cheqAuditor;
//     mapping(uint256 => uint256) public cheqCreated;
//     mapping(uint256 => uint256) public cheqInspectionPeriod;
//     mapping(uint256 => bool) public cheqVoided; 


//     function isWriteable(
//         address sender, 
//         IERC20 _token, 
//         uint256 amount, 
//         uint256 escrowed, 
//         address recipient, 
//         address owner, 
//         address auditor, 
//         uint256 inspectionPeriod
//         ) public view returns(bool) { 
//         return userAuditor[auditor] && auditorUser[sender];
//     }

//     function writeCheq(
//         IERC20 _token,
//         uint256 amount,
//         uint256 escrowed,
//         address recipient,
//         address owner,
//         address auditor,
//         uint256 inspectionPeriod
//         ) external returns(uint256){
//         require(isWriteable(msg.sender, _token, amount, escrowed, recipient, owner), "Not writeable"); 
//         uint256 cheqId = crx.write(msg.sender, recipient, _token, amount, escrowed, this, owner);
//         cheqCreated[cheqId] = block.timestamp;
//         cheqAuditor[cheqId] = auditor;
//         cheqInspectionPeriod[cheqId] = inspectionPeriod;
//         return cheqId;
//     }

//     function isTransferable(uint256 cheqId, address caller) public view returns(bool){
//         // cheq._isApprovedOrOwner(caller, cheqId);  // Need to find out if this is true and return it
//         return crx.ownerOf(cheqId)==caller;
//     }

//     function fundable(uint256 cheqId, address caller, uint256 amount) public view returns(uint256) {
//         return 0;
//     }

//     function cashable(uint256 cheqId, address caller) public view returns(uint256) {  // Let anyone see what's cashable, ALSO 
//         if (block.timestamp >= cheqCreated[cheqId]+cheqInspectionPeriod[cheqId] 
//             || crx.ownerOf(cheqId)!=caller 
//             || cheqVoided[cheqId]){
//             return 0;
//         } else{
//             return crx.cheqEscrowed(cheqId);
//         }
//     }

//     function cashCheq(uint256 cheqId) external {
//         // require(cheq.ownerOf(cheqId)==msg.sender, "Non-owner");  // Keep this check to let user know they don't own it?
//         uint256 cashingAmount = cashable(cheqId, msg.sender);
//         require(cashingAmount>0, "Not cashable");
//         crx.cash(cheqId, msg.sender, cashingAmount);
//     }
    
//     function voidCheq(uint256 cheqId) external {
//         require(cheqAuditor[cheqId]==msg.sender, "Only auditor");
//         cheqVoided[cheqId] = true;
//         crx.cash(cheqId, crx.cheqDrawer(cheqId), crx.cheqEscrowed(cheqId));  // Return escrow to drawer
//     }
//     function status(uint256 cheqId, address caller) public view returns(string memory){
//         if(cashable(cheqId, caller) != 0){
//             return "mature";
//         } else if(cheqVoided[cheqId]){
//             return "voided";
//         } else {
//             return "pending";
//         }
//     }
// }

// require(
//     _isApprovedOrOwner(_msgSender(), cheqId),
//     "Transfer disallowed"
// );

//     function depositWrite(
//         address from,
//         IERC20 _token,
//         uint256 amount,
//         uint256 escrowed,
//         address recipient,
//         address owner
//         ) external
//         returns (uint256){
//         require(deposit(from, _token, amount), "deposit failed");
//         return write(from, recipient, _token, amount, escrowed, owner);

//     }

contract SimpleBank is ICheqBroker, Ownable {  
    CRX public cheq;
    mapping(uint256 => uint256) public cheqCreated;
    mapping(uint256 => bool) public cheqIsPaused;
    mapping(address => bool) public userWhitelist;
    mapping(IERC20 => bool) public tokenWhitelist;
    uint256 public settlementPeriod;

    constructor(CRX _cheq, uint256 settlementTime){
        cheq = _cheq;
        settlementPeriod = settlementTime;
    }

    function whitelistUser(address user, bool isAccepted) public onlyOwner {
        userWhitelist[user] = isAccepted;
    }
    function whitelistToken(IERC20 token, bool isAccepted) public onlyOwner {
        tokenWhitelist[token] = isAccepted;
    }
    function pauseCheq(uint256 cheqId, bool isPaused) public onlyOwner {
        cheqIsPaused[cheqId] = isPaused;
    }

    function isWriteable(address sender, IERC20 token, uint256 amount, uint256 escrowed, address recipient, address owner) public view returns(bool) { 
        return tokenWhitelist[token] && userWhitelist[sender] && userWhitelist[recipient] && amount == escrowed && owner == recipient && amount > 0;
    }

    function writeCheq(
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address recipient
        ) public returns(uint256){
        require(isWriteable(msg.sender, _token, amount, escrow, recipient, recipient), "Not Writable");
        uint256 cheqId = cheq.write(msg.sender, recipient, _token, amount, escrow, recipient);
        cheqCreated[cheqId] = block.timestamp;
        return cheqId;
    }

    function isTransferable(uint256, address, address) public pure returns(bool){
        return false;
    }

    function transferCheq(uint256, address) public pure {
        require(false, "Cant transfer");
    }

    function fundable(uint256, address, uint256) public pure returns(uint256) {
        return 0;
    }
    function fundCheq(uint256, uint256) public pure {
        require(false, "Cant fund");
    }

    function cashable(uint256 cheqId, address caller, uint256) public view returns(uint256) { 
        if (cheq.ownerOf(cheqId)==caller && cheqCreated[cheqId]+settlementPeriod > block.timestamp && !cheqIsPaused[cheqId]) {
            return cheq.cheqEscrowed(cheqId);
        } else {
            return 0;
        }
    }

    function cashCheq(uint256 cheqId, uint256 amount) external {
        uint256 cashableAmount = cashable(cheqId, msg.sender, amount);
        require(cashableAmount > 0, "Not cashable");
        require(cashableAmount == amount, "Cant cash this amount");
        cheq.cash(cheqId, msg.sender, amount);
    }
}


contract PseudoChain is ICheqBroker {  
    CRX public cheq;
    mapping(uint256 => uint256) public blockCashTime;


    constructor(CRX _cheq){
        cheq = _cheq;
        blockCashTime[0] = block.timestamp;
    }
    function isWriteable(address, IERC20, uint256, uint256, address, address) public pure returns(bool) { 
        return true;
    }

    function writeCheq(IERC20 _token, uint256 amount, uint256, address) public returns(uint256){
        // require(blockCashTime[]);
        uint256 cheqId = cheq.write(msg.sender, address(this), _token, amount, amount, address(this));
        blockCashTime[cheqId] = blockCashTime[cheqId-1] + 1 days;
        return cheqId;
    }

    function isTransferable(uint256 cheqId, address caller, address to) public view returns(bool){
        return false;
    }

    function transferCheq(uint256 cheqId, address to) public {
        require(isTransferable(cheqId, msg.sender, to), "Not owner");
        cheq.transferFrom(msg.sender, to, cheqId);
    }

    function fundable(uint256 cheqId, address, uint256) public view returns(uint256) {
        return 0;
    }

    function fundCheq(uint256 cheqId, uint256 amount) public {  
        uint256 fundableAmount = fundable(cheqId, msg.sender, amount);
        require(fundableAmount == amount, "Cant fund this amount");
        cheq.fund(cheqId, msg.sender, amount);
    }

    function cashable(uint256 cheqId, address caller, uint256 blockHash) public view returns(uint256) {
        if (false) { // "0"*n+"..." == keccack((keccack(cheqId) + hash)
            return cheq.cheqEscrowed(cheqId);
        } else {
            return 0;
        }
    }

    function cashCheq(uint256 cheqId, uint256 amount) public {
        uint256 cashableAmount = cashable(cheqId, msg.sender, amount);
        require(cashableAmount == amount, "Cant cash this amount");
        cheq.cash(cheqId, msg.sender, amount);
    }

}