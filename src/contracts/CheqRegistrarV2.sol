// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {Events} from "../contracts/libraries/Events.sol";
import {DataTypes} from "../contracts/libraries/DataTypes.sol";
import {ICheqModule} from "../contracts/interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../contracts/interfaces/ICheqRegistrar.sol";
import {CheqBase64Encoding} from "../contracts/libraries/CheqBase64Encoding.sol";

/** @notice The Inside-out (LensProtocol) design where EOAs call the registrar and registrar calls to PaymentModules (who use RuleModules)
*/
// TODO How to label the modules instances that are created? They don't have to be 721s but could be
// TODO Use Lens' method for ownership tracking that modifies the ERC721 logic to allow NFTstruct{owner, ...} storage/retrieval
// Question: Require the recipient not be the address(0)?
// Question: Implement ownerOf(cheqId) { cheq.module.processOwner(); } to allow ownership revokation?
// Question: Should cash and fund allow user defined amounts? Let the module overrule?
contract CheqRegistrarV2 is ERC721, Ownable, ICheqRegistrar {
    using SafeERC20 for IERC20;
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => DataTypes.Cheq) private _cheqInfo; // Cheq information
    // mapping(address => mapping(IERC20 => uint256)) private _deposits; // TODO remove deposit and just ensure escrowing?
    mapping(bytes32 => bool) private _bytecodeWhitelist;  // TODO Can this be done without two mappings? Having both redeployable and static modules?
    mapping(address => bool) private _addressWhitelist;
    mapping(address => bool) private _tokenWhitelist;
    uint256 private _totalSupply; // Total cheqs created
    uint256 public transferFee; // Percent of flat? Is taken from 
    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor() ERC721("CheqProtocol", "CHEQ") {
        // writeFlatFee = _writeFlatFee;
        // transferFlatFee = _transferFlatFee;
        // fundFlatFee = _fundFlatFee;
        // cashFlatFee = _cashFlatFee;
        // depositFlatFee = _depositFlatFee;
    }

    function _returnCodeHash(address module) internal view returns(bytes32){
        bytes32 moduleCodeHash;
        assembly { moduleCodeHash := extcodehash(module) }
        return moduleCodeHash;
    }
    function whitelistModule(address module, bool bytecodeAccepted, bool addressAccepted) external onlyOwner {  // Whitelist either bytecode or address
        require(bytecodeAccepted != bytecodeAccepted, "CAN'T_ACCEPT_BOTH");
        _bytecodeWhitelist[_returnCodeHash(module)] = bytecodeAccepted;
        _addressWhitelist[module] = addressAccepted;
        emit Events.ModuleWhitelisted(_msgSender(), module, bytecodeAccepted, addressAccepted, block.timestamp);
    }
    function whitelistToken(address _token, bool accepted) external onlyOwner {  // Whitelist for just for safety, modules can prevent additional
        _tokenWhitelist[_token] = accepted;
    }
    function _validModule(address module) internal view returns(bool) {
        return _addressWhitelist[module] || _bytecodeWhitelist[_returnCodeHash(module)];
    }
    function _validWrite(address module, address _token) internal view returns(bool) {
        return _validModule(module) && _tokenWhitelist[_token];  // Valid module and whitelisted currency
    }
    /*//////////////////////////////////////////////////////////////
                              OWNERSHIP
    //////////////////////////////////////////////////////////////*/
    function write(
        DataTypes.Cheq calldata cheq,
        bytes calldata moduleWriteData,  // calldata vs memory
        address owner  // This should be in the cheq Struct
    ) public payable returns (uint256) {  // write on someone's behalf by letting module write it for them using money deposited from them
        require(_validWrite(cheq.module, cheq.currency), "NOT_WHITELISTED");
        // Add the CheqRegistrar Fee to amount, then transferFrom
        require(ICheqModule(cheq.module).processWrite(_msgSender(), owner, _totalSupply, cheq, moduleWriteData), "MODULE: WRITE_FAILED");
        IERC20(cheq.currency).safeTransferFrom(_msgSender(), address(this), cheq.escrowed);  // Question: Could return (bool success, uint256 feeAmount) to figure out fee
        _cheqInfo[_totalSupply] = cheq;
        _cheqInfo[_totalSupply].timeCreated = block.timestamp;  // Not very clean, could be removed, might be redundent with events
        _safeMint(owner, _totalSupply);  // TODO: refactor for LENSPROTOCOL method of tracking ownership

        emit Events.Written(_totalSupply, owner, cheq, moduleWriteData, block.timestamp);
        unchecked { return _totalSupply++; }  // NOTE: Will this ever overflow? Also, returns before increment..?
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory moduleTransferData
    ) public override(ERC721, ICheqRegistrar) {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        DataTypes.Cheq storage cheq = _cheqInfo[tokenId];  // Better to assign and then index?
        require(ICheqModule(cheq.module).processTransfer(_msgSender(), from, to, tokenId, cheq, moduleTransferData), "MODULE: FAILED");
        uint256 escrowedAmount = _cheqInfo[tokenId].escrowed;
        if (escrowedAmount > 0) 
            _cheqInfo[tokenId].escrowed = escrowedAmount - (escrowedAmount * transferFee) / 10_000;  // Take fee in BPS
        emit Events.Transferred(tokenId, ownerOf(tokenId), to, block.timestamp);
        _safeTransfer(from, to, tokenId, "");
    }

    function approve(address to, uint256 tokenId) public override(ERC721, ICheqRegistrar) {   // ERC721- don't allow self_approval, ?(ensure owner is granting approval)
        DataTypes.Cheq memory cheq = _cheqInfo[tokenId];  // Add address approval to the struct?
        require(ICheqModule(cheq.module).processApproval(_msgSender(), to, tokenId, cheq, ""), "MODULE: FAILED");
        _approve(to, tokenId);
    }

    function setApprovalForAll(address /*operator*/, bool /*approved*/) public virtual override {  // Question/TODO: could operators function for a individual modules?? Could feed
        require(false, "OPERATORS_NOT_SUPPORTED");
        // _setApprovalForAll(_msgSender(), operator, approved);
    }

    /*//////////////////////////////////////////////////////////////
                                ESCROW
    //////////////////////////////////////////////////////////////*/
    function fund(  // CheqRegistrar calls erc20 to do transferFrom(). `from` must approve the registrar. How to prevent 3rd parties forcing `from` to fund this if not using from == msg.sender
        uint256 cheqId,
        uint256 amount,  // Question: Allow the module to specify how much to send? Could return (bool success, uint amount)
        bytes calldata fundData  //
    ) external payable { // Can take a flat fee here
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];  // Better to assign and then index?
        require(ICheqModule(cheq.module).processFund(_msgSender(), amount, cheqId, cheq, fundData), "MODULE: FAILED");  // TODO: send fundData as a struct or individual variables?
        IERC20(cheq.currency).safeTransferFrom(_msgSender(), address(this), amount);
        cheq.escrowed += amount;
        emit Events.Funded(_msgSender(), cheqId, fundData, block.timestamp);
    }

    function cash(
        uint256 cheqId,
        uint256 amount,
        address to,
        bytes calldata cashData
    ) external payable {  // Can take a flat fee here
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];  // TODO: Need to give the module the cheq's owner
        require(cheq.escrowed >= amount, "CANT_CASH_AMOUNT"); 
        require(ICheqModule(cheq.module).processCash(_msgSender(), to, amount, cheqId, cheq, cashData), "MODULE: FAILED");  // TODO: send as a struct or individual variables?
        unchecked { cheq.escrowed -= amount; }
        IERC20(cheq.currency).safeTransfer(to, amount);
        emit Events.Cashed(_msgSender(), to, cheqId, cashData, block.timestamp);
    }
    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
    function cheqInfo(uint256 cheqId) public view returns (DataTypes.Cheq memory) {
        return _cheqInfo[cheqId];
    }

    function cheqAmount(uint256 cheqId) public view returns (uint256) {
        return _cheqInfo[cheqId].amount;
    }

    function cheqCurrency(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].currency;
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

    function cheqModule(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].module;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    { // Question: Should this switch case depend on if module has their own tokenURI()?
        _requireMinted(_tokenId);
        DataTypes.Cheq memory cheq = cheqInfo(_tokenId);
        return CheqBase64Encoding.buildMetadata(
            _tokenId,
            address(cheq.currency),
            cheq.amount,
            cheq.escrowed,
            cheq.drawer,
            cheq.recipient,
            cheq.module
        );
    }
}