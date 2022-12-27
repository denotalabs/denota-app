// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC20/IERC20.sol";  // TODO change to safe ERC20? Check interface?
import "openzeppelin/access/Ownable.sol";
import "./ICheqModule.sol";
import "./ERC721r.sol";

// TODO: Burning?
// TODO: UpgradableProxy?
// TODO: Implement and check ICheqModule interface on write()
// 1. Allow escrowing of NFTs- Can create an isFungible splitter in Cheq *struct* point to a deployed NFTOwnershipContract with mapping(uint256(index) => address(NFTAddr)), mapping(uint256(index) => uint256(tokenId)), maxIndex. That way the Cheq Struct can store amount and escrowed for both and the IERC20 address is either the ERC20 or the NFTOwnershipContract. Essentially an adapter between erc20 and erc721 (transforms tokenIds to a fungible `amount`)
// 2. Ensure Write/Deposit supports ERC20 *interface*
// 3. Make sure OpenSea integration works (see how OS tracks metadata)
// 4. Make modules ERC721 compatible?
// 5. Enable URI editing
//     1. Have tokenURI() call to cheqBroker tokenURI (which sets its baseURI and the token's URI)
// 6. Have PayModules emit their own events since the registry is the standard, dApps can query for relevant modules themselves
/**
* @title The cheq registration contract
* @author Alejandro Almaraz
* @notice This contract assigns cheq's their IDs, associated metadata and escrowed funds
* @dev All functions except tokenURI(), approve(), and deposit() must be called by the cheq's payment module
*/
contract CheqRegistrar is ERC721r, Ownable {

    struct Cheq {
        IERC20 token;  // Immutable
        uint256 amount;  // Immutable & arbitrarily settable
        uint256 escrowed;  // Mutable but invariant w.r.t deposits [MOST VULNERABLE]
        address drawer; // Immutable & arbitrarily settable [intended sender]
        address recipient; // Immutable & arbitrarily settable [intended claimer]
        ICheqModule module;  // Immutable & not settable
    }
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => Cheq) private _cheqInfo; // Cheq information
    // TODO: change to `_escrows`? users may not deposit independent of write()
    mapping(address => mapping(IERC20 => uint256)) private _deposits; // Total user deposits
    mapping(address => mapping(ICheqModule => bool)) private _userModuleWhitelist; // Total user deposits
    uint256 private _totalSupply; // Total cheqs created
    uint256 private writeFlatFee;
    uint256 private transferFlatFee;
    uint256 private fundFlatFee;
    uint256 private cashFlatFee;
    uint256 private depositFlatFee;
    // How to set version and/or chain deployment? 
    // Options: 
    //// Each deployment is it's own int. 
    //// Each chain is it's own int.
    //// Some combination of the two

    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposited(IERC20 indexed token, address indexed to, uint256 amount);
    event Written(uint256 indexed cheqId, IERC20 token, uint256 amount, uint256 escrowed, address indexed drawer, address recipient, ICheqModule indexed module); // NOTE ownership is tracked using the Transfer event
    // event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);  // NOTE: Modules don't need this
    event Funded(uint256 indexed cheqId, address indexed from, uint256 amount);
    event Cashed(uint256 indexed cheqId, address indexed to, uint256 amount);
    event ModuleWhitelisted(address indexed user, ICheqModule indexed module, bool isAccepted);
    
    modifier onlyModule(uint256 cheqId){require(_msgSender() == address(_cheqInfo[cheqId].module), "Only cheq's module");_;}
    modifier userWhitelisted(ICheqModule module){require(_userModuleWhitelist[_msgSender()][module], "Only whitelisted modules");_;}

    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor(uint256 _writeFlatFee, uint256 _transferFlatFee, uint256 _fundFlatFee, uint256 _cashFlatFee, uint256 _depositFlatFee) ERC721r("CheqProtocol", "CHEQ") {
        writeFlatFee = _writeFlatFee;
        transferFlatFee = _transferFlatFee;
        fundFlatFee = _fundFlatFee;
        cashFlatFee = _cashFlatFee;
        depositFlatFee = _depositFlatFee;
    }

    function changeFlatFees(uint256 _writeFlatFee, uint256 _transferFlatFee, uint256 _fundFlatFee, uint256 _cashFlatFee, uint256 _depositFlatFee) external onlyOwner {
        writeFlatFee = _writeFlatFee;
        transferFlatFee = _transferFlatFee;
        fundFlatFee = _fundFlatFee;
        cashFlatFee = _cashFlatFee;
        depositFlatFee = _depositFlatFee;
    }

    function whitelistModule(ICheqModule module, bool isAccepted) external {  // Allow non-_msgSender()?
        _userModuleWhitelist[_msgSender()][module] = isAccepted;
        emit ModuleWhitelisted(_msgSender(), module, isAccepted);
    }
    /*//////////////////////////////////////////////////////////////
                        OWNERSHIP FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function write(
        address from,
        address recipient,
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address owner
    ) public payable 
        returns (uint256)
    {
        require(msg.value >= writeFlatFee, "INSUF_FEE");
        ICheqModule module = ICheqModule(_msgSender());
        // require(_msgSender().supportInterface("0xffffffff"), "INVAL_MODULE");
        if (from != _msgSender()){ // The module is trying to use `from` deposit on their behalf instead of its own
            require(_userModuleWhitelist[from][module], "UNAPP_MODULE"); // See if user allows this
        }
        require(
            escrow <= _deposits[from][_token],
            "INSUF_BAL"
        );
        _deposits[from][_token] -= escrow;  // Deduct address balance
        _cheqInfo[_totalSupply] = Cheq({
            token: _token,
            amount: amount,
            escrowed: escrow, 
            drawer: from,
            recipient: recipient,
            module: module
        });
        _safeMint(owner, _totalSupply);
        emit Written(_totalSupply, _token, amount, escrow, from, recipient, module);
        unchecked {_totalSupply += 1;}
        return _totalSupply - 1;
    }

    function transferFrom(  // TODO ensure the override is correct
        address from,
        address to,
        uint256 cheqId
    ) public onlyModule(cheqId) override payable {
        require(msg.value >= transferFlatFee, "INSUF_FEE");
        _transfer(from, to, cheqId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 cheqId
    ) public onlyModule(cheqId) override payable {
        require(msg.value >= transferFlatFee, "INSUF_FEE");
        _safeTransfer(from, to, cheqId, "");
    }

    /*//////////////////////////////////////////////////////////////
                          ESCROW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function fund(uint256 cheqId, address from, uint256 amount) external payable onlyModule(cheqId) {  // `From` can originate from anyone, module specifies whose balance it is removing from though
        require(msg.value >= fundFlatFee, "INSUF_FEE");
        Cheq storage cheq = _cheqInfo[cheqId]; 
        IERC20 _token = cheq.token;
        require(amount <= _deposits[from][_token], "INSUF_BAL");
        unchecked {_deposits[from][_token] -= amount;}
        cheq.escrowed += amount;
        emit Funded(cheqId, from, amount);
    }

    function cash(uint256 cheqId, address to, uint256 cashAmount) external payable onlyModule(cheqId) {
        require(msg.value >= cashFlatFee, "INSUF_FEE");
        Cheq storage cheq = _cheqInfo[cheqId]; 
        require(cheq.escrowed >= cashAmount, "Can't cash more than available");
        unchecked {cheq.escrowed -= cashAmount;}
        require(cheq.token.transfer(to, cashAmount), "Transfer failed");
        emit Cashed(cheqId, to, cashAmount);
    }

    function _deposit(
        IERC20 token,
        address to,
        uint256 amount
    ) private {
        require(msg.value >= depositFlatFee, "INSUF_FEE");  // TODO do internal function calls preserve msg.value?
        require(token.transferFrom(
            _msgSender(),  // transfers from `_msgSender()` to `address(this)` first checking if  _msgSender() approves address(this)
            address(this),
            amount
        ), "Transfer failed");
        _deposits[to][token] += amount;
        emit Deposited(token, to, amount);  // TODO: is this needed? Assumes people will deposit onto registrar
    }
    function deposit(IERC20 _token, uint256 _amount) external payable returns (bool) {
        _deposit(_token, _msgSender(), _amount);  // Only makes sense for
        return true;
    }
    function deposit(  // Deposit to another account
        IERC20 token,
        address to,
        uint256 amount
    ) public payable returns (bool) {
        _deposit(token, to, amount);
        return true;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {  // TODO: make this registrar's URI? contractURI?
        _requireMinted(tokenId);
        return ICheqModule(_cheqInfo[tokenId].module).tokenURI(tokenId);
    }

    function depositWrite(
        address payer,  // Person putting up the escrow
        address drawer,  // Person sending the cheq. If `payer`!=`drawer`, payer must approve module
        address recipient,
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address owner) external payable returns (uint256){
        _deposit(_token, payer, escrow); // Make a require with bool success?
        return write(drawer, recipient, _token, amount, escrow, owner);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function cheqInfo(uint256 cheqId) public view returns (Cheq memory){
        return _cheqInfo[cheqId];
    }
    function cheqAmount(uint256 cheqId) public view returns (uint256) {
        return _cheqInfo[cheqId].amount;
    }
    function cheqToken(uint256 cheqId) public view returns (IERC20) {
        return _cheqInfo[cheqId].token;
    }
    function cheqDrawer(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].drawer;
    }
    function cheqRecipient(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].recipient;
    }
    function cheqEscrowed(uint256 cheqId) public view returns (uint256) {
        return _cheqInfo[cheqId].escrowed;
    }
    function cheqModule(uint256 cheqId) public view returns (ICheqModule) {
        return _cheqInfo[cheqId].module;
    }
    function deposits(address user, IERC20 token) public view returns (uint256) {
        return _deposits[user][token];
    }
    function userModuleWhitelist(address user, ICheqModule module) public view returns (bool) {
        return _userModuleWhitelist[user][module];
    }
    function totalSupply() public view returns(uint256){
        return _totalSupply;
    }
}
