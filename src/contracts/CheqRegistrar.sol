// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";
import "./ICheqModule.sol";

// TODO: Burning?
// TODO: UpgradableProxy?
// TODO: Implement and check ICheqModule interface on write()
// TODO: Have the write function attempt deposit if insufficient balance?
// TODO: _transfer() calls _beforeTokenTransfer, _afterTokenTransfer functions. Necessary?
// TODO: Are operators too dangerous?!?
// TODO: WHY DOES REGISTRAR NEED TO BE ERC721 COMPATIBLE?? WHY NOT JUST MODULES?
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

_tokenApprovals are outsourced to the payment module
_operatorApprovals are (probably) DISALLOWED, as is is/setApprovedForAll()
 */
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
    mapping(uint256 => Cheq) private cheqInfo; // Cheq information
    mapping(address => mapping(IERC20 => uint256)) private _deposits; // Total user deposits
    mapping(address => mapping(ICheqModule => bool)) private _userModuleWhitelist; // Total user deposits
    uint256 private totalSupply; // Total cheqs created
    uint256 private writeFlatFee;
    uint256 private transferFlatFee;
    uint256 private fundFlatFee;
    uint256 private cashFlatFee;
    uint256 private depositFlatFee;
    // uint256 private approveFlatFee;
    // uint256 public chainId;
    // uint256 public version;

    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposited(IERC20 indexed token, address indexed to, uint256 amount);
    event Written(uint256 indexed cheqId, IERC20 token, uint256 amount, uint256 escrowed, address indexed drawer, address recipient, ICheqModule indexed module, address owner); 
    // event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
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

    function whitelistModule(ICheqModule module, bool isAccepted) external {
        _userModuleWhitelist[_msgSender()][module] = isAccepted;
        emit ModuleWhitelisted(_msgSender(), module, isAccepted);
    }
    /*//////////////////////////////////////////////////////////////
                            USER DEPOSITS
    //////////////////////////////////////////////////////////////*/
    
    // How to track whitelisted deposits VS module deposits?
    // Need ability for user's to deposit on user's behalf
    function _deposit(  // Allow modules to deposit on their user's behalf
        IERC20 token,
        address to,
        uint256 amount
    ) private {
        require(msg.value > depositFlatFee, "INSUF_FEE");  // TODO do internal function calls preserve msg.value?
        require(token.transferFrom(
            to,
            address(this),
            amount
        ), "Transfer failed");
        _deposits[to][token] += amount;
        emit Deposited(token, to, amount);
    }

    function deposit(IERC20 _token, uint256 _amount) public payable returns (bool) {  // make one external and use other in depositWrite()?
        _deposit(_token, _msgSender(), _amount);
        return true;
    }

    function deposit(  
        address to,
        IERC20 token,
        uint256 amount
    ) public payable returns (bool) {
        _deposit(token, to, amount);
        return true;
    }

    /*//////////////////////////////////////////////////////////////
                        ERC-721 FUNCTION USAGE
    //////////////////////////////////////////////////////////////*/
    // TODO: User whitelist of Module functionality
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
        // require(_msgSender().supportInterface("0xffffffff"), "INVAL_MODULE");
        if (from != _msgSender()){ // The module is trying to use `from` deposit on their behalf instead of its own
            require(_userModuleWhitelist[from][ICheqModule(_msgSender())], "UNAPP_MODULE"); // See if user allows this
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
            module: ICheqModule(_msgSender())
        });
        _safeMint(owner, totalSupply);
        emit Written(totalSupply, _token, amount, escrow, from, recipient, ICheqModule(_msgSender()), owner);
        totalSupply += 1;
        return totalSupply - 1;
    }

// BUG can't make function payable
// TODO: Make transfers callable by approved accounts
    function transferFrom(
        address from,
        address to,
        uint256 cheqId
    ) public onlyModule(cheqId) virtual override {
        // require(msg.value > transferFlatFee, "INSUF_FEE");
        _transfer(from, to, cheqId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 cheqId
    ) public onlyModule(cheqId) virtual override {
        // require(msg.value > transferFlatFee, "INSUF_FEE");
        _safeTransfer(from, to, cheqId, "");
    }
    
    function getApproved(uint256 tokenId) public view virtual override returns (address) {
        _requireMinted(tokenId);
        ICheqModule module = cheqInfo[tokenId].module;

        return module.isApprovable(tokenId, _msgSender());
    }
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view virtual override returns (bool) {
        address owner = ERC721.ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }
    /**
    Options:
    Allow approved to call into CheqRegistrar to transferFrom but don't allow anyone else to
    1. return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    2. return (isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    3. return (getApproved(tokenId) == spender);
    4. return ICheqModule(tokenId).isApproved();
    */

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

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);
        return ICheqModule(cheqInfo[tokenId].module).tokenURI(tokenId);
    }

    function approve(address to, uint256 tokenId) public virtual override {
        // require(msg.value > approveFlatFee, "INSUF_FEE");
        require(ICheqModule(cheqInfo[tokenId].module).isApprovable(tokenId, _msgSender(), to), "NOT_APPROVABLE");
        _approve(to, tokenId);
        require(); // Update module variables
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


// contract Test is ERC721 {
//     // Why does transferFrom check isApprovedOrOwner() and _tranfer checks owner again?
//     function _transfer(
//         address from,
//         address to,
//         uint256 tokenId
//     ) internal virtual {  // If this is called only check is `to` is not address(0)
//         // require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
//         require(to != address(0), "ERC721: transfer to the zero address");
//         // _beforeTokenTransfer(from, to, tokenId, 1);
//         // // Check that tokenId was not transferred by `_beforeTokenTransfer` hook
//         // require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
//         // Clear approvals from the previous owner
//         delete _tokenApprovals[tokenId];
//         unchecked {
//             _balances[from] -= 1;
//             _balances[to] += 1;
//         }
//         _owners[tokenId] = to;
//         emit Transfer(from, to, tokenId);
//         // _afterTokenTransfer(from, to, tokenId, 1);
//     }
//     function _safeTransfer( // _safeTransfer -> _transfer
//         address from,
//         address to,
//         uint256 tokenId,
//         bytes memory data
//     ) internal virtual {
//         _transfer(from, to, tokenId);
//         require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
//     }
//     function transferFrom( // transferFrom:[iAO] -> _transfer
//         address from,
//         address to,
//         uint256 tokenId
//     ) public virtual override {
//         require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
//         _transfer(from, to, tokenId);
//     }
//     function safeTransferFrom( // safeTransferFrom:[iAO] -> _safeTransfer -> _transfer
//         address from,
//         address to,
//         uint256 tokenId,
//         bytes memory data
//     ) public virtual override {
//         require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
//         _safeTransfer(from, to, tokenId, data);
//     }
//     function safeTransferFrom(  // safeTransferFrom -> safeTransferFrom:[iAO] -> _safeTransfer -> _transfer
//         address from,
//         address to,
//         uint256 tokenId
//     ) public virtual override {
//         safeTransferFrom(from, to, tokenId, "");  
//     }

    
//     // ?? Modules can opt-in to approvals by allowing approve() ??

//     // Maybe the module vs approved check should be on [iAO]
//     // [iAO] checks 

//     //                                          transferFrom:[iAO] -> _transfer
//     //                     safeTransferFrom:[iAO] -> _safeTransfer -> _transfer
//     // safeTransferFrom -> safeTransferFrom:[iAO] -> _safeTransfer -> _transfer

//     /**

//     // ERC721 ASSUMES: 
//         Owner is allowed to transfer AND _msgSender() == ownerOf OR
//         _msgSender() isApproved || isOperator
//     // We WANT:
//         Outsource all transfer logic to the module

//     // dApps EXPECT to call: 
//         CheqRegistrar.approve()
//         CheqRegistrar.transferFrom()
//     // dApps PROBABLY:
//         Check approvals on the front-end then
//         Call approve() if not approved and transferFrom() if they are


//     transferFrom(){
//         ICheqModule module = cheqInfo[cheqId].module;

//         if(_msgSender() == address(module)){
//             _transfer();
//         } else{
//             require(isApprovedOrOwner(_msgSender())); // Which only checks approvals, EOA owner must call from Module
//             module.beforeTransfer(); // are before and after necessary??
//             _transfer();
//             module.afterTransfer();
//         }
//     }

//      */
// }