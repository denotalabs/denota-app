// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC20/IERC20.sol";  // TODO change to safe ERC20? Check interface?
import "openzeppelin/access/Ownable.sol";
import "./ICheqModule.sol";
import "./ERC721r.sol";

// TODO: Burning?
// TODO: UpgradableProxy?
// TODO: Implement and check ICheqModule interface on write()
// TODO: Have the write function attempt deposit if insufficient balance?
// TODO: _transfer() calls _beforeTokenTransfer, _afterTokenTransfer functions. Necessary?
// TODO: Are operators too dangerous?!?
// TODO: WHY DOES REGISTRAR NEED TO BE ERC721 COMPLIANT?? WHY NOT JUST MODULES?
//// Enable EOAs to call in from registrar or not needed?

// 1. Allow escrowing of NFTs- Can create an isFungible splitter in Cheq *struct* point to a deployed NFTOwnershipContract with mapping(uint256(index) => address(NFTAddr)), mapping(uint256(index) => uint256(tokenId)), maxIndex. That way the Cheq Struct can store amount and escrowed for both and the IERC20 address is either the ERC20 or the NFTOwnershipContract. Essentially an adapter between erc20 and erc721 (transforms tokenIds to a fungible `amount`)
// 2. Ensure Write/Deposit supports ERC20 *interface*
// 3. Make all functions external
// 4. Make sure OpenSea integration works
//     1. See how OS tracks metadata
// 5. Make modules ERC721 compatible?
// 6. Enable URI editing
//     1. Have tokenURI() call to cheqBroker tokenURI (which sets its baseURI and the token's URI)
// 7. Allow modules to modify deposits freely?? May allow yield from their end. Or just give them their own deposits
//     1. Not sure how to track both which user deposited, and which module deposited on their behalf
//         1. Now user’s can’t freely use different modules with their deposits, does this matter??
// 8. Have PayModules emit their own events since the registry is the standard, dApps can query for relevant modules themselves

/**
ERC721 Inherits these variables:
mapping(uint256 => address) private _tokenApprovals; // Mapping from token ID to approved address
mapping(address => mapping(address => bool)) private _operatorApprovals; // Mapping from owner to operator approvals

TODO _tokenApprovals are outsourced to the payment module
TODO _operatorApprovals are (probably) DISALLOWED, as is is/setApprovedForAll()
 */
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
    mapping(uint256 => Cheq) private cheqInfo; // Cheq information
    mapping(address => mapping(IERC20 => uint256)) private _deposits; // Total user deposits (NOTE: change to escrows? users may not deposit separate from write())
    mapping(address => mapping(ICheqModule => bool)) private _userModuleWhitelist; // Total user deposits
    uint256 private totalSupply; // Total cheqs created
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
    event Written(uint256 indexed cheqId, IERC20 token, uint256 amount, uint256 escrowed, address indexed drawer, address recipient, ICheqModule indexed module, address owner); 
    // event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);  // NOTE: Modules don't need this
    event Funded(uint256 indexed cheqId, address indexed from, uint256 amount);
    event Cashed(uint256 indexed cheqId, address indexed to, uint256 amount);
    event ModuleWhitelisted(address indexed user, ICheqModule indexed module, bool isAccepted);
    
    modifier onlyModule(uint256 cheqId){require(_msgSender() == address(cheqInfo[cheqId].module), "Only cheq's module");_;}
    modifier userWhitelisted(ICheqModule module){require(_userModuleWhitelist[_msgSender()][module], "Only whitelisted modules");_;}

    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor(uint256 _writeFlatFee, uint256 _transferFlatFee, uint256 _fundFlatFee, uint256 _cashFlatFee, uint256 _depositFlatFee) ERC721("CheqProtocol", "CHEQ") {
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
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _deposit(
        IERC20 token,
        address to,
        uint256 amount
    ) private {
        require(msg.value > depositFlatFee, "INSUF_FEE");  // TODO do internal function calls preserve msg.value?
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
    ) external payable returns (bool) {
        _deposit(token, to, amount);
        return true;
    }

    function write(
        address from,
        address recipient,
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address owner
    ) external payable 
        returns (uint256)
    {
        require(msg.value > writeFlatFee, "INSUF_FEE");
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
        cheqInfo[totalSupply] = Cheq({
            token: _token,
            amount: amount,
            escrowed: escrow, 
            drawer: from,
            recipient: recipient,
            module: module
        });
        _safeMint(owner, totalSupply);
        emit Written(totalSupply, _token, amount, escrow, from, recipient, module, owner);
        totalSupply += 1;
        return totalSupply - 1;
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

    function transferFrom(  // TODO ensure the override is correct
        address from,
        address to,
        uint256 cheqId
    ) public onlyModule(cheqId) virtual override payable {
        require(msg.value > transferFlatFee, "INSUF_FEE");
        _transfer(from, to, cheqId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 cheqId
    ) public onlyModule(cheqId) virtual override payable {
        require(msg.value > transferFlatFee, "INSUF_FEE");
        _safeTransfer(from, to, cheqId, "");
    }

    function fund(uint256 cheqId, address from, uint256 amount) external payable onlyModule(cheqId) {  // `From` can originate from anyone, module specifies whose balance it is removing from though
        require(msg.value > fundFlatFee, "INSUF_FEE");
        Cheq storage cheq = cheqInfo[cheqId]; 
        IERC20 _token = cheq.token;
        require(amount <= _deposits[from][_token], "INSUF_BAL");
        unchecked {_deposits[from][_token] -= amount;}
        cheq.escrowed += amount;
        emit Funded(cheqId, from, amount);
    }

    function cash(uint256 cheqId, address to, uint256 cashAmount) external payable onlyModule(cheqId) {
        require(msg.value > cashFlatFee, "INSUF_FEE");
        Cheq storage cheq = cheqInfo[cheqId]; 
        require(cheq.escrowed >= cashAmount, "Can't cash more than available");
        unchecked {cheq.escrowed -= cashAmount;}
        require(cheq.token.transfer(to, cashAmount), "Transfer failed");
        emit Cashed(cheqId, to, cashAmount);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {  // TODO: make this registrar's URI? contractURI?
        _requireMinted(tokenId);
        return ICheqModule(cheqInfo[tokenId].module).tokenURI(tokenId);
    }

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
    function cheqModule(uint256 cheqId) external view returns (ICheqModule) {
        return cheqInfo[cheqId].module;
    }
    function deposits(address user, IERC20 token) external view returns (uint256) {
        return _deposits[user][token];
    }
    function userModuleWhitelist(address user, ICheqModule module) external view returns (bool) {
        return _userModuleWhitelist[user][module];
    }
}
