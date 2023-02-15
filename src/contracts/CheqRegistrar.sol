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

/** 
 * @notice The Inside-out (LensProtocol) design where EOAs call the registrar and registrar calls to PaymentModules (who use RuleModules)
 * WFC fees are taken in gas and BPS while transfer is taken from cheq.escrowed to stay compatibile
*/
// Note Arseniy- calling contracts may not be able to convert their storage to calldata when calling functions
// Revert if frontend gives the wrong amount (MM should know if it would revert (using Ethers call estimateGas, will also tell you if it will revert))
// TODO ensure BPS avoids over/underflow
// TODO what would a gnosis app need?
// TODO accept native token using address(0) as it's address? Or use wrapped version?
// TODO need to convert rules to libraries
// TODO need to have an upgradable proxy of the cheqRegistrar
// TODO be able to wrap a tranferFrom with an Cheq NFT without having a module (W will always work and send raw, T will always work, F will always fail, C will always fail)
// TODO Calculate amount+fees in the frontend the same way as contract (use BigNumber), use view function
// TODO Create a module labeling schema?
// TODO deploy your own DAO and see how difficult it is
// TODO developers want to develop if we already have a lot of users and they can make money from fees, or 
// TODO determine proper fee uint sizes
// Question: Add function to deploy modules from the registrar?
// Question: Implement ownerOf(cheqId) { cheq.module.processOwner(); } to allow ownership revokation?
contract CheqRegistrar is ERC721, Ownable, ICheqRegistrar {
    using SafeERC20 for IERC20;
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => DataTypes.Cheq) private _cheqInfo;
    uint256 private _totalSupply;
    
    mapping(bytes32 => bool) private _bytecodeWhitelist;  // Question Can these be done without two mappings? Having both redeployable and static modules?
    mapping(address => bool) private _addressWhitelist;
    mapping(address => bool) private _ruleWhitelist;  // Question make these bytecode specific? Rule specific?
    mapping(address => bool) private _tokenWhitelist;

    mapping(address => mapping(address=>uint256)) private _moduleRevenue;  // Could collapse this into a single mapping
    mapping(address => uint256) private _registrarRevenue;
    uint256 internal constant BPS_MAX = 10_000;  // Lens uses uint16
    DataTypes.WTFCFees public fees;
    uint256 public _writeFlatFee;  // 

    constructor(DataTypes.WTFCFees memory _fees) ERC721("CheqProtocol", "CHEQ") {
        fees = _fees;
    }

    /*//////////////////////////////////////////////////////////////
                              
    //////////////////////////////////////////////////////////////*/
    function validWrite(address module, address token) public view returns(bool) {
        return _validModule(module) && _tokenWhitelist[token];  // Valid module and whitelisted currency
    }
    function write(
        DataTypes.Cheq calldata cheq,
        address owner,
        bool isDirectPay,
        bytes calldata moduleWriteData
    ) public payable returns (uint256) {
        // Writing checks
        // require(msg.value >= _writeFlatFee, "INSUF_FEE"); // Question
        require(validWrite(cheq.module, cheq.currency), "NOT_WHITELISTED");  // Module+token whitelist check
        
        // Module hook
        uint256 moduleBPS = ICheqModule(cheq.module).processWrite(_msgSender(), owner, _totalSupply, cheq, isDirectPay, moduleWriteData);  // TODO add isInstant boolean?
        
        // Cheq Minting
        _safeMint(owner, _totalSupply);
        _cheqInfo[_totalSupply] = cheq;  // Question: Is this cheaper?
        _cheqInfo[_totalSupply].mintTimestamp = block.timestamp;  // Not ideal

        // Fee taking and escrowing
        uint256 cheqFee = (cheq.escrowed * fees.writeBPS) / BPS_MAX;  // uint256 totalBPS = fees.writeBPS + moduleBPS; but need to emit and add to reserves
        uint256 moduleFee = (cheq.escrowed * moduleBPS) / BPS_MAX;
        if (isDirectPay) {
            IERC20(cheq.currency).safeTransferFrom(_msgSender(), address(this), cheqFee + moduleFee);  // Take token fees
            IERC20(cheq.currency).safeTransferFrom(_msgSender(), owner, cheq.escrowed);  // Send token to owner
            _cheqInfo[_totalSupply].escrowed = 0;
        } else {
            IERC20(cheq.currency).safeTransferFrom(_msgSender(), address(this), cheq.escrowed + cheqFee + moduleFee);
        }
        _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
        _registrarRevenue[cheq.currency] += cheqFee;

        emit Events.Written(_totalSupply, owner, cheq, isDirectPay, moduleWriteData, cheqFee, moduleFee, block.timestamp);
        unchecked { return _totalSupply++; }  // NOTE: Will this ever overflow?
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        // Removed the approveOrOwner check, allow module to decide
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory moduleTransferData
    ) public override(ERC721, ICheqRegistrar) {
        address owner = ownerOf(tokenId);
        bool isApproved = _msgSender() == getApproved(tokenId);
        DataTypes.Cheq storage cheq = _cheqInfo[tokenId];  // Better to assign and then index?

        // Module hook
        uint256 moduleBPS = ICheqModule(cheq.module).processTransfer(_msgSender(), isApproved, owner, from, to, tokenId, cheq, moduleTransferData);
        
        // Fee taking and escrowing
        uint256 cheqFee;
        uint256 moduleFee;
        if (cheq.escrowed > 0) {
            cheqFee = (cheq.escrowed * fees.transferBPS) / BPS_MAX;
            moduleFee = (cheq.escrowed * moduleBPS) / BPS_MAX;
            cheq.escrowed = cheq.escrowed - cheqFee + moduleFee;
            _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
            _registrarRevenue[cheq.currency] += cheqFee;
        }

        emit Events.Transferred(tokenId, owner, to, cheqFee, moduleFee, block.timestamp);
        _safeTransfer(from, to, tokenId, "");
    }

    function fund(
        uint256 cheqId,
        uint256 amount,
        bool isDirectPay,
        bytes calldata fundData
    ) external payable {
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];
        address owner = ownerOf(cheqId);

        // Module hook
        uint256 moduleBPS = ICheqModule(cheq.module).processFund(_msgSender(), owner, amount, isDirectPay, cheqId, cheq, fundData);

        // Fee taking and escrow
        uint256 cheqFee = (amount * fees.fundBPS) / BPS_MAX;
        uint256 moduleFee = (amount * moduleBPS) / BPS_MAX;
        if (isDirectPay) {
            IERC20(cheq.currency).safeTransferFrom(_msgSender(), address(this), cheqFee + moduleFee);  // Take token fees
            IERC20(cheq.currency).safeTransferFrom(_msgSender(), owner, amount);  // Send token to owner
        } else {
            IERC20(cheq.currency).safeTransferFrom(_msgSender(), address(this), cheq.escrowed + cheqFee + moduleFee);
            cheq.escrowed += amount;
        }
        _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
        _registrarRevenue[cheq.currency] += cheqFee;

        emit Events.Funded(_msgSender(), cheqId, amount, isDirectPay, fundData, cheqFee, moduleFee, block.timestamp);
    }

    function cash(
        uint256 cheqId,
        uint256 amount,
        address to,
        bytes calldata cashData
    ) external payable {  // Should percent fee work here too?
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];
        
        // Module Hook
        uint256 moduleFee = ICheqModule(cheq.module).processCash(_msgSender(), ownerOf(cheqId), to, amount, cheqId, cheq, cashData);

        // Fee taking
        uint256 cheqFee = (amount * fees.cashBPS) / BPS_MAX;  // TODO find proper way to take BPS to prevent over/underflow
        uint256 allFees = cheqFee + moduleFee;
        _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
        _registrarRevenue[cheq.currency] += cheqFee;
        uint256 totalAmount = amount + allFees;

        // Un-escrowing
        require(cheq.escrowed >= totalAmount, "CANT_CASH_AMOUNT");  // TODO may cause funds to be stuck if fees are added
        unchecked { cheq.escrowed -= totalAmount; }
        IERC20(cheq.currency).safeTransfer(to, totalAmount);

        emit Events.Cashed(_msgSender(), to, cheqId, cashData, cheqFee, moduleFee, block.timestamp);
    }

    function approve(address to, uint256 tokenId) public override(ERC721, ICheqRegistrar) {  
        // Approval check
        require(to != _msgSender(), "SELF_APPROVAL");

        // Module hook
        DataTypes.Cheq memory cheq = _cheqInfo[tokenId];
        ICheqModule(cheq.module).processApproval(_msgSender(), ownerOf(tokenId), to, tokenId, cheq, "");
        
        // Approve
        _approve(to, tokenId);
    }
    function setApprovalForAll(address /*operator*/, bool /*approved*/) public pure override { // Question: Does OS require operators?
        require(false, "OPERATORS_NOT_SUPPORTED");
        // _setApprovalForAll(_msgSender(), operator, approved);
    }
    /*//////////////////////////////////////////////////////////////
                            FEE FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function updateFees(DataTypes.WTFCFees calldata _fees) external onlyOwner {
        fees = _fees;
    }
    function moduleWithdraw(address token, uint256 amount, address to) external {
        require(_moduleRevenue[_msgSender()][token] >= amount, "INSUF_FUNDS");
        unchecked { _moduleRevenue[_msgSender()][token] -= amount; }
        IERC20(token).safeTransferFrom(address(this), to, amount);
    }
    function getFees() public view returns( uint256, uint256, uint256, uint256){
        return (fees.writeBPS, fees.transferBPS, fees.fundBPS, fees.cashBPS);
    }
    function getTotalFees(uint256 cheqId, uint8 _WTFC) public view returns(uint256, uint256){
        (uint256 wf, uint256 tf, uint256 ff, uint256 cf) = getFees();  // TODO there has to be a better way
        uint256[4] memory registrarFees; 
        registrarFees = [wf, tf, ff, cf];

        (uint256 mwf, uint256 mtf, uint256 mff, uint256 mcf) = ICheqModule(_cheqInfo[cheqId].module).getFees();
        uint256[4] memory moduleFees; 
        moduleFees = [mwf, mtf, mff, mcf];
        
        return (registrarFees[_WTFC], moduleFees[_WTFC]);
    }
    /*//////////////////////////////////////////////////////////////
                        WHITELIST FUNCTIONS
    //////////////////////////////////////////////////////////////*/
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
    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
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
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
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
    // function ownerOf(uint256 tokenId) public view override returns (address) {
    //     address owner = _ownerOf(tokenId);
    //     // require(ICheqModule(_cheqInfo[tokenId].module).processOwnerOf(_msgSender(), tokenId), "MODULE: DENIED");
    //     require(owner != address(0), "ERC721: invalid token ID");
    //     return owner;
    // }
    // function balanceOf(address owner) public view override returns (uint256) {
    //     // uint256 tokenBalance = module.processBalanceOf(owner); // takes into consideration blacklisted
    // }
}