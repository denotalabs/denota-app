// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";
import "./ICheqModule.sol";

// TODO: Burning?
// TODO: UpgradableProxy?
// TODO: User whitelist
// TODO: Implement and check ICheqModule interface on write()
// TODO: Make transfers callable by approved accounts

/**
* @title The cheq registration contract
* @author Alejandro Almaraz
* @notice This contract assigns cheq's their IDs, associated metadata and escrowed funds
* @dev All functions except tokenURI(), approve(), and deposit() must be called by the cheq's payment module
*/
contract CheqRegistrar is ERC721, Ownable {

    struct Cheq {
        IERC20 token;  // IMMUTABLE [not settable]
        uint256 amount;  // ? Module can modify ?
        uint256 escrowed;  // Module can modify [MOST VULNERABLE, corresponds to registrar deposits]
        address drawer; // IMMUTABLE [settable]  !INTENDED DRAWER
        address recipient; // IMMUTABLE [settable]  !INTENDED ?FIRST OWNER
        ICheqModule module;  // IMMUTABLE [not settable]
    }
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => Cheq) public cheqInfo; // Cheq information
    mapping(address => mapping(IERC20 => uint256)) public deposits; // Total user deposits
    mapping(address => mapping(ICheqModule => bool)) public userModuleWhitelist; // Total user deposits
    uint256 public totalSupply; // Total cheqs created
    // uint256 public chainId;
    // uint256 public version;

    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposited(IERC20 indexed token, address indexed to, uint256 amount);
    event Written(uint256 indexed cheqId, IERC20 token, uint256 amount, uint256 escrowed, address indexed drawer, address recipient, ICheqModule indexed module, address owner); 
    event Funded(uint256 indexed cheqId, address indexed from, uint256 amount);
    event Cashed(uint256 indexed cheqId, address indexed to, uint256 amount);
    event ModuleWhitelisted(ICheqModule indexed module, address indexed user, bool isAccepted, string moduleName);
    
    modifier onlyModule(uint256 cheqId){require(_msgSender() == address(cheqInfo[cheqId].module), "Only cheq's module");_;}
    modifier userWhitelisted(ICheqModule module){require(userModuleWhitelist[_msgSender()][module], "Only whitelisted modules");_;}  // TODO User whitelist this

    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor() ERC721("CheqProtocol", "CHEQ") {}

    function whitelistModule(ICheqModule module, bool isAccepted, string memory moduleName) external onlyOwner {
        userModuleWhitelist[_msgSender()][module] = isAccepted;
        emit ModuleWhitelisted(module, _msgSender(), isAccepted, moduleName);
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
            to,
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
    ) public
        returns (uint256)
    {
        // require(_msgSender().supportInterface("0xffffffff"), "INVAL_MODULE");  // TODO Finalize this standard
        if (from != _msgSender()){ // The module is trying to use `from` deposit on their behalf instead of its own
            require(userModuleWhitelist[from][ICheqModule(_msgSender())], "UNAPP_MODULE"); // See if user allows this
        }
        require(
            escrow <= deposits[from][_token],
            "INSUF_BAL"
        );
        deposits[from][_token] -= escrow;  // Deduct address balance
        cheqInfo[totalSupply] = Cheq({
            token: _token,
            amount: amount,
            escrowed: escrow, 
            drawer: from,
            recipient: recipient,
            module: ICheqModule(_msgSender())
        });
        _safeMint(owner, totalSupply);
        emit Written(totalSupply, _token, amount, escrow, from, recipient, ICheqModule(_msgSender()), owner);
        totalSupply += 1;
        return totalSupply - 1;
    }

    function transferFrom(
        address from,
        address to,
        uint256 cheqId
    ) public onlyModule(cheqId) virtual override {
        _transfer(from, to, cheqId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 cheqId,
        bytes memory data
    ) public onlyModule(cheqId) virtual override {
        _safeTransfer(from, to, cheqId, data);
    }

    function fund(uint256 cheqId, address from, uint256 amount) external onlyModule(cheqId) {  // `From` can originate from anyone, module specifies whose balance it is removing from though
        Cheq storage cheq = cheqInfo[cheqId]; 
        IERC20 _token = cheq.token;
        require(amount <= deposits[from][_token], "INSUF_BAL");
        unchecked {deposits[from][_token] -= amount;}
        cheq.escrowed += amount;
        emit Funded(cheqId, from, amount);
    }

    function cash(uint256 cheqId, address to, uint256 cashAmount) external onlyModule(cheqId) {
        Cheq storage cheq = cheqInfo[cheqId]; 
        require(cheq.escrowed >= cashAmount, "Can't cash more than available");
        unchecked {cheq.escrowed -= cashAmount;}
        require(cheq.token.transfer(to, cashAmount), "Transfer failed");
        emit Cashed(cheqId, to, cashAmount);
    }
    function _isApprovedOrOwner(address spender, uint256 cheqId) internal view override returns (bool) {
        return spender == address(cheqInfo[cheqId].module);  // delegate checks/functionality to cheq module
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        return ICheqModule(cheqInfo[tokenId].module).tokenURI(tokenId);
    }

    function approve(address to, uint256 tokenId) public virtual override onlyModule(tokenId) {
        // address owner = ERC721.ownerOf(tokenId);
        // require(to != owner, "ERC721: approval to current owner");
        // require(
        //     _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
        //     "ERC721: approve caller is not token owner or approved for all"
        // );
        _approve(to, tokenId);
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
}