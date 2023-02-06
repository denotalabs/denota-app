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
 * WFC fees are taken in gas while transfer is taken from the cheq value to stay compatibile
*/
// TODO: Module return can be (wasSuccessful, value). Would give more flexibility
// TODO Use Lens' method for ownership (tracking that modifies the ERC721 logic to allow NFTstruct{owner, ...} storage/retrieval)
// TODO Create a module labeling schema
// TODO: Create way for front-end operators to get a cut?
// Question: Require the recipient not be the address(0) or allow module to handle that?
// Question: Implement ownerOf(cheqId) { cheq.module.processOwner(); } to allow ownership revokation?
// Question: Add function to deploy modules from the registrar?
// Question: Should WTFC rules throw or return bool to bubble up? Likewise should incorrect user parameters be corrected by the module and executed or fail?
contract CheqRegistrar is ERC721, Ownable, ICheqRegistrar {
    using SafeERC20 for IERC20;
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(address => mapping(address=>uint256)) private _moduleTokenRevenue;
    mapping(uint256 => DataTypes.Cheq) private _cheqInfo; // Cheq information
    mapping(bytes32 => bool) private _bytecodeWhitelist;  // Question Can these be done without two mappings? Having both redeployable and static modules?
    mapping(address => bool) private _addressWhitelist;
    mapping(address => bool) private _ruleWhitelist;  // Question make these bytecode specific? Rule specific?
    mapping(address => bool) private _tokenWhitelist;
    mapping(address => uint256) private _transferReserve;
    uint256 private _totalSupply;  // Total cheqs created
    uint256 public _writeFlatFee;  // Question can use a smaller data type?
    uint256 public _writeBPSFee;
    uint256 public _transferFee; // BPS fee taken from cheq.amount
    uint256 public _fundFlatFee;
    uint256 public _fundBPSFee;  // Question: should all fees except transfer have BPS?
    uint256 public _cashFlatFee;
    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    constructor(
        uint256 writeFlatFee_,
        uint256 transferFee_,
        uint256 fundFlatFee_,
        uint256 cashFlatFee_
    ) ERC721("CheqProtocol", "CHEQ") {
        _writeFlatFee = writeFlatFee_;
        _transferFee = transferFee_;
        _fundFlatFee = fundFlatFee_;
        _cashFlatFee = cashFlatFee_;
    }
    function updateFees(
        uint256 writeFlatFee_,
        uint256 transferFee_,
        uint256 fundFlatFee_,
        uint256 cashFlatFee_
    ) external onlyOwner {
        _writeFlatFee = writeFlatFee_;
        _transferFee = transferFee_;
        _fundFlatFee = fundFlatFee_;
        _cashFlatFee = cashFlatFee_;
    }
    function whitelistModule(
        address module, 
        bool bytecodeAccepted, 
        bool addressAccepted
    ) external onlyOwner {  // Whitelist either bytecode or address
        require(bytecodeAccepted != addressAccepted ||  // Can't accept both, but 
                !(bytecodeAccepted || addressAccepted), // can revoke both
                "CAN'T_ACCEPT_BOTH");
        _bytecodeWhitelist[_returnCodeHash(module)] = bytecodeAccepted;
        _addressWhitelist[module] = addressAccepted;
        emit Events.ModuleWhitelisted(_msgSender(), module, bytecodeAccepted, addressAccepted, block.timestamp);
    }
    function whitelistToken(address _token, bool accepted) external onlyOwner {  // Whitelist for safety, modules can be more restrictive
        _tokenWhitelist[_token] = accepted;
         emit Events.TokenWhitelisted(_msgSender(), _token, accepted, block.timestamp);
    }
    function whitelistRule(address rule, bool accepted) external onlyOwner {
        _ruleWhitelist[rule] = accepted;
        emit Events.RuleWhitelisted(_msgSender(), rule, accepted, block.timestamp);
    }

    function _returnCodeHash(address module) public view returns(bytes32){
        bytes32 moduleCodeHash;
        assembly { moduleCodeHash := extcodehash(module) }
        return moduleCodeHash;
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
        require(msg.value >= _writeFlatFee, "INSUF_FEE");
        require(_validWrite(cheq.module, cheq.currency), "NOT_WHITELISTED");  // Checks module and token whitelist
        
        // HACK: Changing the cheq.module should be disallowed. Where to check it?
        // Question: In what cases would adjusting- currency, owner, drawer, or recipient make sense? (amount and escrowed might)
        (bool success, uint256 moduleFee, DataTypes.Cheq memory adjCheq) = ICheqModule(cheq.module).processWrite(_msgSender(), owner, _totalSupply, cheq, moduleWriteData);
        require(success, "MODULE: WRITE_FAILED");  // Module returns their feeAmount and is added to their withdrawable
        
        uint256 cheqFee = (adjCheq.escrowed * _writeBPSFee) / 10_000;
        uint256 allFees = cheqFee + moduleFee;
        IERC20(adjCheq.currency).safeTransferFrom(_msgSender(), address(this), adjCheq.escrowed + allFees);
        _moduleTokenRevenue[adjCheq.module][adjCheq.currency] += moduleFee;
        
        _safeMint(owner, _totalSupply);
        _cheqInfo[_totalSupply] = adjCheq;
        _cheqInfo[_totalSupply].mintTimestamp = block.timestamp;  // Not ideal

        emit Events.Written(_totalSupply, owner, adjCheq, moduleWriteData, block.timestamp);
        unchecked { return _totalSupply++; }  // NOTE: Will this ever overflow? Also, returns before the increment..?
    }

    function transferFrom(  // Removed the approveOrOwner check, allow module to decide
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
        // require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        address owner = ownerOf(tokenId);  // Shouldn't from == owner??
        DataTypes.Cheq storage cheq = _cheqInfo[tokenId];  // Better to assign and then index?
        (bool success, address adjTo) = ICheqModule(cheq.module).processTransfer(_msgSender(), owner, from, to, tokenId, cheq, moduleTransferData);
        require(success, "MODULE: FAILED");

        uint256 escrowedAmount = _cheqInfo[tokenId].escrowed;
        uint256 cheqFee = (escrowedAmount * _transferFee) / 10_000;
        if (escrowedAmount > 0) _cheqInfo[tokenId].escrowed = escrowedAmount - cheqFee;  // Take fee in BPS
        emit Events.Transferred(tokenId, ownerOf(tokenId), adjTo, block.timestamp);
        _safeTransfer(from, adjTo, tokenId, "");
    }

    function approve(address to, uint256 tokenId) public override(ERC721, ICheqRegistrar) {  
         // ERC721 doesn't allow self_approval, ?(ensure owner is granting approval)
        DataTypes.Cheq memory cheq = _cheqInfo[tokenId];
        address owner = ownerOf(tokenId);
        (bool success, address adjTo) = ICheqModule(cheq.module).processApproval(_msgSender(), owner, to, tokenId, cheq, "");
        require(success, "MODULE: FAILED");
        _approve(adjTo, tokenId);
    }
    function setApprovalForAll(address /*operator*/, bool /*approved*/) public pure override { // Question: Does OS require operators?
        require(false, "OPERATORS_NOT_SUPPORTED");
        // _setApprovalForAll(_msgSender(), operator, approved);
    }

    /*//////////////////////////////////////////////////////////////
                                ESCROW
    //////////////////////////////////////////////////////////////*/
    function fund(  // CheqRegistrar calls erc20 to do transferFrom(). `from` must approve the registrar. How to prevent 3rd parties forcing `from` to fund this if not using from == msg.sender
        uint256 cheqId,
        uint256 amount,  // Question: Allow the module to specify how much to send? Could return (bool success, uint amount)
        bytes calldata fundData
    ) external payable {
        require(msg.value >= _fundFlatFee, "INSUF_FEE");
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];  // Better to assign and then index?

        address owner = ownerOf(cheqId);
        (bool success, uint256 moduleFee, uint256 adjAmount) = ICheqModule(cheq.module).processFund(_msgSender(), owner, amount, cheqId, cheq, fundData);
        require(success, "MODULE: FAILED");
        
        uint256 cheqFee = (adjAmount * _fundBPSFee) / 10_000;
        uint256 allFees = cheqFee + moduleFee;
        IERC20(cheq.currency).safeTransferFrom(_msgSender(), address(this), adjAmount + allFees);
        _moduleTokenRevenue[cheq.module][cheq.currency] += moduleFee;
        cheq.escrowed += adjAmount;
        emit Events.Funded(_msgSender(), cheqId, fundData, block.timestamp);
    }

    function cash(
        uint256 cheqId,
        uint256 amount,
        address to,
        bytes calldata cashData
    ) external payable {  // Should percent fee work here too?
        require(msg.value >= _cashFlatFee, "INSUF_FEE");
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];
        
        address owner = ownerOf(cheqId);
        (bool success, uint256 moduleFee, uint256 adjAmount) = ICheqModule(cheq.module).processCash(_msgSender(), owner, to, amount, cheqId, cheq, cashData);
        require(success, "MODULE: FAILED");  // TODO: send as a struct or individual variables?

        require(cheq.escrowed >= adjAmount, "CANT_CASH_AMOUNT"); 
        unchecked { cheq.escrowed -= adjAmount; }

        IERC20(cheq.currency).safeTransfer(to, adjAmount);

        _moduleTokenRevenue[cheq.module][cheq.currency] += moduleFee;

        emit Events.Cashed(_msgSender(), to, cheqId, cashData, block.timestamp);
    }

    function moduleWithdraw(address token, uint256 amount, address payoutAccount) external {
        require(_moduleTokenRevenue[_msgSender()][token] >= amount, "INSUF_FUNDS");
        IERC20(token).safeTransferFrom(address(this), payoutAccount, amount);
        unchecked { _moduleTokenRevenue[_msgSender()][token] -= amount; }
    }

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
    function ownerOf(uint256 tokenId) public view virtual override returns (address) {
        address owner = _ownerOf(tokenId);
        // require(ICheqModule(_cheqInfo[tokenId].module).processOwnerOf(_msgSender(), tokenId), "MODULE: DENIED");
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }
    /**
    function balanceOf(address owner) public view override returns (uint256) {
        // uint256 tokenBalance = module.processBalanceOf(owner); // takes into consideration blacklisted
    }
     */
    function cheqInfo(uint256 cheqId) public view returns (DataTypes.Cheq memory) {
        return _cheqInfo[cheqId];
    }
    function cheqDrawerRecipient(uint256 cheqId) external view returns(address, address) {
         return (_cheqInfo[cheqId].drawer, _cheqInfo[cheqId].recipient);
    }
    function cheqDrawer(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].drawer;
    }
    function cheqRecipient(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].recipient;
    }
    function cheqCurrencyValueEscrow(uint256 cheqId) external view returns(address, uint256, uint256) {
        return (_cheqInfo[cheqId].currency, _cheqInfo[cheqId].amount, _cheqInfo[cheqId].escrowed);
    }
    function cheqCurrency(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].currency;
    }
    function cheqAmount(uint256 cheqId) public view returns (uint256) {
        return _cheqInfo[cheqId].amount;
    }
    function cheqEscrowed(uint256 cheqId) public view returns (uint256) {
        return _cheqInfo[cheqId].escrowed;
    }
    function cheqModule(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].module;
    }

    function moduleWhitelisted(address module) public view returns(bool, bool) {
        return (_addressWhitelist[module], _bytecodeWhitelist[_returnCodeHash(module)]);
    }
    function tokenWhitelisted(address token) public view returns(bool) {
        return _tokenWhitelist[token];
    }
    function ruleWhitelisted(address rule) external view returns(bool){
        return _ruleWhitelist[rule];
    }
    function rulesWhitelisted(address writeRule, address transferRule, address fundRule, address cashRule, address approveRule) external view returns(bool) {
        return _ruleWhitelist[writeRule] && _ruleWhitelist[transferRule] && _ruleWhitelist[fundRule] && _ruleWhitelist[cashRule] && _ruleWhitelist[approveRule];
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
        string memory _tokenURI = ICheqModule(cheq.module).processTokenURI(_tokenId);

        if (bytes(_tokenURI).length == 0) {
            return CheqBase64Encoding.buildMetadata(
                _tokenId,
                address(cheq.currency),
                cheq.amount,
                cheq.escrowed,
                cheq.drawer,
                cheq.recipient,
                cheq.module
            );
        } else {
            return _tokenURI;
        }
        
    }
    function getFees() public view returns(uint256, uint256, uint256, uint256, uint256, uint256){
        return (_writeFlatFee, _writeBPSFee, _transferFee, _fundFlatFee, _fundBPSFee, _cashFlatFee);
    }
}