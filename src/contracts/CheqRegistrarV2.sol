// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";
import "openzeppelin/token/ERC721/ERC721.sol";

/** @notice The Inside-out (LensProtocol) design where EOAs call the registrar and registrar calls to modules (who use libraries)
 * Changes:
 * EOA calls write() which calls ICheqModule(module).writeCheq() then returns success
 * 
*/
library Events {  // emit cheq structs or each variable?
    event ModuleGlobalsGovernanceSet(
        address indexed prevGovernance,
        address indexed newGovernance,
        uint256 timestamp
    );
    event ModuleGlobalsTreasurySet(
        address indexed prevTreasury,
        address indexed newTreasury,
        uint256 timestamp
    );
    event ModuleGlobalsTreasuryFeeSet(
        uint16 indexed prevTreasuryFee,
        uint16 indexed newTreasuryFee,
        uint256 timestamp
    );
    event FeeModuleBaseConstructed(address indexed moduleGlobals, uint256 timestamp);
    event ModuleBaseConstructed(address indexed registrar, uint256 timestamp);
    // TODO: emit the address of the module or the bytehash?
    event ModuleWhitelisted(
        address indexed user,
        address indexed module,
        bool isAccepted, 
        bool isClonable,
        uint256 timestamp
    );

    event Written(
        uint256 indexed cheqId,
        address indexed owner, 
        DataTypes.Cheq indexed cheq,
        bytes data, 
        uint256 timestamp
    );
    event Transferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 timestamp);
    event Funded(address indexed funder, uint256 indexed cheqId, bytes indexed fundData, uint256 timestamp);
    event Cashed(address indexed casher, address to, uint256 indexed cheqId, bytes indexed cashData, uint256 timestamp);
}
library Errors {
    // error CannotInitImplementation();
    // error Initialized();
    // error SignatureExpired();
    // error ZeroSpender();
    // error SignatureInvalid();
    // error NotOwnerOrApproved();
    error NotRegistrar();
    // error TokenDoesNotExist();
    error NotGovernance();
    // error NotGovernanceOrEmergencyAdmin();
    // error EmergencyAdminCannotUnpause();
    // error CallerNotWhitelistedModule();
    // error CollectModuleNotWhitelisted();
    // error FollowModuleNotWhitelisted();
    // error ReferenceModuleNotWhitelisted();
    // error ProfileCreatorNotWhitelisted();
    // error NotProfileOwner();
    // error NotProfileOwnerOrDispatcher();
    // error NotDispatcher();
    // error PublicationDoesNotExist();
    // error HandleTaken();
    // error HandleLengthInvalid();
    // error HandleContainsInvalidCharacters();
    // error HandleFirstCharInvalid();
    // error ProfileImageURILengthInvalid();
    // error CallerNotFollowNFT();
    // error CallerNotCollectNFT();
    // error BlockNumberInvalid();
    // error ArrayMismatch();
    // error CannotCommentOnSelf();
    // error NotWhitelisted();
    // error InvalidParameter();

    // // Module Errors
    error InitParamsInvalid();
    // error CollectExpired();
    // error FollowInvalid();
    // error ModuleDataMismatch();
    // error FollowNotApproved();
    // error MintLimitExceeded();
    // error CollectNotAllowed();

    // MultiState Errors
    error Paused();
    error PublishingPaused();
}
library DataTypes {
    struct Cheq {
        IERC20 currency; // Immutable
        uint256 amount; // Immutable & arbitrarily settable
        uint256 escrowed; // Mutable but invariant w.r.t deposits [MOST VULNERABLE]
        // address owner;   // TODO LensProtocol way of simplifying owner functions since NFTs are structs
        address drawer; // Immutable & arbitrarily settable [intended sender]
        address recipient; // Immutable & arbitrarily settable [intended claimer]
        address module; // Immutable & not settable
        uint256 timeCreated;  // BUG: This should be stored but 
        // bool isImmutable;  // IDEA: May add reliability by denying cheqs from being modifiable by their modules
        // bool isFungible; // IDEA: Allow escrowing a single NFT. Multiple would be more difficult since amount/escrowed == tokenId ? 0
    }
}
abstract contract ModuleBase {
    address public immutable REGISTRAR;

    modifier onlyRegistrar() {
        if (msg.sender != REGISTRAR) revert Errors.NotRegistrar();
        _;
    }
    constructor(address registrar) {
        if (registrar == address(0)) revert Errors.InitParamsInvalid();
        REGISTRAR = registrar;
        emit Events.ModuleBaseConstructed(registrar, block.timestamp);
    }
}
interface IModuleGlobals {
    function setGovernance(address newGovernance) external;
    function setTreasury(address newTreasury) external;
    function setTreasuryFee(uint16 newTreasuryFee) external;
    function getGovernance() external view returns (address);
    function getTreasury() external view returns (address);
    function getTreasuryFee() external view returns (uint16);
    function getTreasuryData() external view returns (address, uint16);
}
contract ModuleGlobals is IModuleGlobals {
    uint16 internal constant BPS_MAX = 10000;
    address internal _governance;
    address internal _treasury;
    uint16 internal _treasuryFee;
    // uint256 internal writeFlatFee;
    // uint256 internal transferFlatFee;
    // uint256 internal fundFlatFee;
    // uint256 internal cashFlatFee;
    // uint256 internal depositFlatFee;

    modifier onlyGov() {
        if (msg.sender != _governance) revert Errors.NotGovernance();
        _;
    }
    constructor(
        address governance,
        address treasury,
        uint16 treasuryFee
    ) {
        _setGovernance(governance);
        _setTreasury(treasury);
        _setTreasuryFee(treasuryFee);
    }
    /// @inheritdoc IModuleGlobals
    function setGovernance(address newGovernance) external override onlyGov {
        _setGovernance(newGovernance);
    }
    /// @inheritdoc IModuleGlobals
    function setTreasury(address newTreasury) external override onlyGov {
        _setTreasury(newTreasury);
    }
    /// @inheritdoc IModuleGlobals
    function setTreasuryFee(uint16 newTreasuryFee) external override onlyGov {
        _setTreasuryFee(newTreasuryFee);
    }
    /// @inheritdoc IModuleGlobals
    function getGovernance() external view override returns (address) {
        return _governance;
    }
    /// @inheritdoc IModuleGlobals
    function getTreasury() external view override returns (address) {
        return _treasury;
    }
    /// @inheritdoc IModuleGlobals
    function getTreasuryFee() external view override returns (uint16) {
        return _treasuryFee;
    }
    //@inheritdoc IModuleGlobals
    function getTreasuryData() external view override returns (address, uint16) {
        return (_treasury, _treasuryFee);
    }
    function _setGovernance(address newGovernance) internal {
        if (newGovernance == address(0)) revert Errors.InitParamsInvalid();
        address prevGovernance = _governance;
        _governance = newGovernance;
        emit Events.ModuleGlobalsGovernanceSet(prevGovernance, newGovernance, block.timestamp);
    }
    function _setTreasury(address newTreasury) internal {
        if (newTreasury == address(0)) revert Errors.InitParamsInvalid();
        address prevTreasury = _treasury;
        _treasury = newTreasury;
        emit Events.ModuleGlobalsTreasurySet(prevTreasury, newTreasury, block.timestamp);
    }
    function _setTreasuryFee(uint16 newTreasuryFee) internal {
        if (newTreasuryFee >= BPS_MAX / 2) revert Errors.InitParamsInvalid();
        uint16 prevTreasuryFee = _treasuryFee;
        _treasuryFee = newTreasuryFee;
        emit Events.ModuleGlobalsTreasuryFeeSet(prevTreasuryFee, newTreasuryFee, block.timestamp);
    }
}
interface ICheqModuleV2 {
    function processWrite(address caller, address owner, uint cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool);
    function processTransfer(address caller, address from, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory data) external returns (bool);
    function processFund(address caller, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool);
    function processCash(address caller, address to, uint256 amount, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes calldata initData) external returns (bool);
    function processApproval(address caller, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory initData) external returns (bool);
}
library CheqBase64Encoding {

    function buildMetadata(
        uint256 _tokenId,
        address currency,
        uint256 amount,
        uint256 escrowed,
        address drawer,
        address recipient,
        address module
    )
        external
        view
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    encode(
                        bytes(
                            abi.encodePacked(
                                "{\"name\":",
                                    "Cheq serial number #", _tokenId,
                                    // '", "description":"',
                                    // cheq.description,
                                    // '", "image": "',
                                    // "data:image/svg+xml;base64,",
                                    // buildImage(_tokenId),
                                    ", \"attributes\": ",
                                    "[",
                                        "{\"trait_type\": \"Token\",", "\"value\":", currency, "}",
                                        "{\"trait_type\": \"Amount\",", "\"value\":", amount, "}",
                                        "{\"trait_type\": \"Escrowed\",", "\"value\":", escrowed, "}",
                                        "{\"trait_type\": \"Drawer\",", "\"value\":", drawer, "}",
                                        "{\"trait_type\": \"Recipient\",", "\"value\":", recipient, "}",
                                        "{\"trait_type\": \"Module\",", "\"value\":", module, "}",
                                    "]",
                                "}"
                            )
                        )
                    )
                )
            );
    }
    /**
     * @dev Base64 Encoding/Decoding Table
     */
    string internal constant _TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    /**
     * @dev Converts a `bytes` to its Bytes64 `string` representation.
     */
    function encode(bytes memory data) internal pure returns (string memory) {
        /**
         * Inspired by Brecht Devos (Brechtpd) implementation - MIT licence
         * https://github.com/Brechtpd/base64/blob/e78d9fd951e7b0977ddca77d92dc85183770daf4/base64.sol
         */
        if (data.length == 0) return "";

        // Loads the table into memory
        string memory table = _TABLE;

        // Encoding takes 3 bytes chunks of binary data from `bytes` data parameter
        // and split into 4 numbers of 6 bits.
        // The final Base64 length should be `bytes` data length multiplied by 4/3 rounded up
        // - `data.length + 2`  -> Round up
        // - `/ 3`              -> Number of 3-bytes chunks
        // - `4 *`              -> 4 characters for each chunk
        string memory result = new string(4 * ((data.length + 2) / 3));

        /// @solidity memory-safe-assembly
        assembly {
            // Prepare the lookup table (skip the first "length" byte)
            let tablePtr := add(table, 1)

            // Prepare result pointer, jump over length
            let resultPtr := add(result, 32)

            // Run over the input, 3 bytes at a time
            for {
                let dataPtr := data
                let endPtr := add(data, mload(data))
            } lt(dataPtr, endPtr) {

            } {
                // Advance 3 bytes
                dataPtr := add(dataPtr, 3)
                let input := mload(dataPtr)

                // To write each character, shift the 3 bytes (18 bits) chunk
                // 4 times in blocks of 6 bits for each character (18, 12, 6, 0)
                // and apply logical AND with 0x3F which is the number of
                // the previous character in the ASCII table prior to the Base64 Table
                // The result is then added to the table to get the character to write,
                // and finally write it in the result pointer but with a left shift
                // of 256 (1 byte) - 8 (1 ASCII char) = 248 bits

                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance

                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1) // Advance
            }

            // When data `bytes` is not exactly 3 bytes long
            // it is padded with `=` characters at the end
            switch mod(mload(data), 3)
            case 1 {
                mstore8(sub(resultPtr, 1), 0x3d)
                mstore8(sub(resultPtr, 2), 0x3d)
            }
            case 2 {
                mstore8(sub(resultPtr, 1), 0x3d)
            }
        }

        return result;
    }
}
/**
 * @notice CheqRegistrar handles: Whitelisting/?Deploying modules, Escrowing funds, and Storing cheq data
 * Question: Take Flat fees in gas through WFC and Percent through module and transfers (reduces cheq.escrowed)?
 * Question: Should process_() return non-booleans?
 * TODO: send cheq as a struct or individual variables?
 */
interface ICheqRegistrar {
    function write(DataTypes.Cheq calldata cheq, bytes calldata moduleWriteData, address owner) external payable returns (uint256);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory moduleTransferData) external;
    function approve(address to, uint256 tokenId) external;
    function fund(uint256 cheqId, uint256 amount, bytes calldata fundData) external payable;
    function cash(uint256 cheqId, uint256 amount, address to, bytes calldata cashData) external payable;
    function cheqInfo(uint256 cheqId) external view returns (DataTypes.Cheq memory);
    function cheqAmount(uint256 cheqId) external view returns (uint256);
    function cheqCurrency(uint256 cheqId) external view returns (IERC20);
    function cheqDrawer(uint256 cheqId) external view returns (address);
    function cheqRecipient(uint256 cheqId) external view returns (address);
    function cheqEscrowed(uint256 cheqId) external view returns (uint256);
    function cheqModule(uint256 cheqId) external view returns (ICheqModuleV2);
}
contract CheqRegistrarV2 is ERC721, Ownable {
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => DataTypes.Cheq) private _cheqInfo; // Cheq information
    mapping(address => mapping(IERC20 => uint256)) private _deposits; // TODO remove deposit and just ensure escrowing?
    mapping(bytes32 => bool) private _bytecodeWhitelist;  // TODO Can this be done without two mappings? Having both redeployable and static modules?
    mapping(address => bool) private _addressWhitelist;
    uint256 private _totalSupply; // Total cheqs created
    uint256 public transferFee;
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
    function _returnCodeHash(address module) internal returns(bytes32){
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
    function _whitelistedOrCloneable(address module) internal returns(bool) {
        return _addressWhitelist[module] || _bytecodeWhitelist[_returnCodeHash(module)];
    }
    /*//////////////////////////////////////////////////////////////
                              OWNERSHIP
    //////////////////////////////////////////////////////////////*/
    function write(
        DataTypes.Cheq calldata cheq,
        bytes calldata moduleWriteData,  // calldata vs memory
        address owner
    ) external payable returns (uint256) {  // write on someone's behalf by letting module write it for them using money deposited from them
        require(_whitelistedOrCloneable(cheq.module), "MODULE_NOT_WHITELISTED");
        require(cheq.currency.transferFrom(_msgSender(), address(this), cheq.escrowed), "ERC20: TRANFER_FAILED");  // BUG how to limit attack surface from arbitrary external token call?
        // Modules are external too but whitelisted
        require(ICheqModuleV2(cheq.module).processWrite(_msgSender(), owner, _totalSupply, cheq, moduleWriteData), "MODULE: WRITE_FAILED");

        _cheqInfo[_totalSupply] = cheq;
        _cheqInfo[_totalSupply].timeCreated = block.timestamp;  // Not very clean, could be removed, might be redundent
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
        uint256 tokenId
    ) public virtual override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory moduleTransferData
    ) public override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: caller is not token owner or approved");
        DataTypes.Cheq storage cheq = _cheqInfo[tokenId];  // Better to assign and then index?
        require(ICheqModuleV2(cheq.module).processTransfer(_msgSender(), from, to, tokenId, cheq, moduleTransferData), "MODULE: FAILED");
        uint256 escrowedAmount = _cheqInfo[tokenId].escrowed;
        if (escrowedAmount > 0) 
            _cheqInfo[tokenId].escrowed = escrowedAmount - (escrowedAmount * transferFee) / 10_000;  // Take fee in BPS
        emit Events.Transferred(tokenId, ownerOf(tokenId), to, block.timestamp);
        _safeTransfer(from, to, tokenId, "");
    }

    function approve(address to, uint256 tokenId) public override { 
        // address owner = ERC721.ownerOf(tokenId);  // Probably allow the the module to do this
        // require(to != owner, "ERC721: approval to current owner");
        // require(
        //     _msgSender() == owner || isApprovedForAll(owner, _msgSender()),
        //     "ERC721: approve caller is not token owner or approved for all"
        // );
        DataTypes.Cheq storage cheq = _cheqInfo[tokenId];
        require(ICheqModuleV2(cheq.module).processApproval(_msgSender(), to, tokenId, cheq, ""), "MODULE: FAILED");
        _approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    /*//////////////////////////////////////////////////////////////
                                ESCROW
    //////////////////////////////////////////////////////////////*/
    function fund(  // CheqRegistrar calls erc20 to do transferFrom(). `from` must approve the registrar. How to prevent 3rd parties forcing `from` to fund this if not using from == msg.sender
        uint256 cheqId,
        uint256 amount,
        bytes calldata fundData  //
    ) external payable {
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];  // Better to assign and then index?
        require(cheq.currency.transferFrom(_msgSender(), address(this), amount), "ERC20: TRANFER_FAILED");  // TODO: safeTransferFrom
        require(ICheqModuleV2(cheq.module).processFund(_msgSender(), amount, cheqId, cheq, fundData), "MODULE: FAILED");  // TODO: send as a struct or individual variables?
        cheq.escrowed += amount;
        emit Events.Funded(_msgSender(), cheqId, fundData, block.timestamp);
    }

    function cash(
        uint256 cheqId,
        uint256 amount,
        address to,
        bytes calldata cashData
    ) external payable {
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];
        require(cheq.escrowed >= amount, "CANT_CASH_AMOUNT");
        unchecked { cheq.escrowed -= amount; }
        require(ICheqModuleV2(cheq.module).processCash(_msgSender(), to, amount, cheqId, cheq, cashData), "MODULE: FAILED");  // TODO: send as a struct or individual variables?
        require(cheq.currency.transfer(to, amount), "ERC20: TRANFER_FAILED");  // TODO: safeTransferFrom
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

    function cheqCurrency(uint256 cheqId) public view returns (IERC20) {
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

    function cheqModule(uint256 cheqId) public view returns (ICheqModuleV2) {
        return ICheqModuleV2(_cheqInfo[cheqId].module);
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

library AddressGating {  // Each of these libraries should correspond to a certain module type
    function isAllowed(mapping(address => bool) storage addressBoolMapping, address _address, bool isAllowlist) external returns (bool){
        if (isAllowlist){
            return addressBoolMapping[_address];
        } else {
            return !addressBoolMapping[_address];
        }
    }
}
library NFTGating {  // Doesn't use storage slots... Maybe Layout must be compatible w/ Library?
    function isAllowed(address _NFTContract, address _address, bool isAllowlist) external returns (bool){
        if (isAllowlist){
            return IERC721(_NFTContract).balanceOf(_address) > 0;
        } else {
            return IERC721(_NFTContract).balanceOf(_address) == 0;
        }
    }
}
/**
 * @notice this can/should be an abstract contract for inheriting this module storage type
 * 
 */
contract Marketplace is ModuleBase, Ownable, ERC721, ICheqModuleV2 {
    // Should cashing be entire at a time or less?
    // `InProgress` might not need to be explicit (Invoice.workerStatus=ready && Invoice.clientStatus=ready == working)
    enum Status {
        Waiting,
        Ready,
        InProgress,
        Disputing,
        Finished
    }
    // Should milestones have timestamp aspect?
    struct Milestone {
        uint256 amounts;
        bool workerFinished;
        bool clientReleasable;
    }
    // Can add expected completion date and refund partial to relevant party if late
    struct Invoice {
        uint256 startTime;
        Status workerStatus;
        Status clientStatus;
        Milestone[] milestones;
    }
    // mapping(uint256 => uint256) public inspectionPeriods; // Would this give the reversibility period?
    mapping(uint256 => Invoice) public invoices;
    mapping(IERC20 => bool) public tokenWhitelist;
    string private baseURI;

    function whitelistToken(IERC20 token, bool whitelist) public onlyOwner {
        tokenWhitelist[token] = whitelist;
    }

    constructor(address registrar) ERC721("SSTL", "SelfSignTimeLock") ModuleBase(registrar){}
    
    function processWrite(
        address caller,
        address owner,
        uint cheqId,
        DataTypes.Cheq calldata cheq,
        bytes calldata initData
    ) external onlyRegistrar returns(bool){
        require(cheq.drawer == caller, "Can't send on behalf");  // This could be delegated
        require(cheq.recipient != owner, "Can't self send");  // TODO figure out LENS' 721 ownership modification
        require(cheq.amount > 0, "Can't send cheq with 0 value");  // Library function could be canWrite()->bool
        require(tokenWhitelist[cheq.currency], "Token not whitelisted");

        // bool cheqIsWriteable = writeModule.canWrite(caller, owner, cheqId, cheq);
        // if (!cheqIsWriteable) { return false; }

        (uint256 startTime, Status workerStatus, Status clientStatus, Milestone[] memory milestones) = abi.decode(initData, (uint256, Status, Status, Milestone[]));

        invoices[cheqId].startTime = startTime;
        invoices[cheqId].workerStatus = workerStatus;
        invoices[cheqId].clientStatus = clientStatus;
        invoices[cheqId].milestones = milestones;
        return true;
    }
    // Where should require(ownerOf(cheqId) == msg.sender) be?
    function processTransfer(
        address caller, 
        address from,
        address to,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes memory initData
    ) external onlyRegistrar returns (bool) {

        return true;
    }

    function processFund(
        address caller,
        uint256 amount,
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external onlyRegistrar returns (bool) {
        // uint256 fundableAmount = fundable(cheqId, _msgSender(), amount);
        // require(fundableAmount > 0, "Not fundable");  // Are
        // require(fundableAmount == amount, "Cant fund this amount");
        
        // cheqCreated[cheqId] = block.timestamp; // BUG: can update with 0 at any time- If it can be funded its an invoice, reset creation date for job start
        return true;
    }

    function processCash(
        address caller, 
        address to,
        uint256 amount, 
        uint256 cheqId, 
        DataTypes.Cheq calldata cheq, 
        bytes calldata initData
    ) external onlyRegistrar returns (bool) {
        return true;
    }


    function processApproval(address caller, address to, uint256 cheqId, DataTypes.Cheq calldata cheq, bytes memory initData) external returns (bool){
        return true;
    }


    function setBaseURI(string calldata _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function earlyRelease(uint256 cheqId, Status status) public {  // Should this allow the parties to set arbitrary Statuses?
        if (_msgSender() == REGISTRAR.cheqDrawer(cheqId)){
            invoices[cheqId].workerStatus = status;
        } else if (_msgSender() == REGISTRAR.cheqRecipient(cheqId)){
            invoices[cheqId].clientStatus = status;
        }
    }

/**
struct Invoice {
    uint256 startTime;
    Status workerStatus;
    Status clientStatus;
    Milestone[] milestones;
}
    */
}


    // function _fundable(
    //     uint256 cheqId,
    //     address,
    //     uint256) private returns (uint256) {
    //     if (cheq.cheqEscrowed(cheqId) == 0) {
    //         // Invoice  // && caller == cheqReciever[cheqId]
    //         return cheq.cheqAmount(cheqId);
    //     } else {
    //         // Cheq
    //         return 0;
    //     }
    // }
    // function fundable(
    //     uint256 cheqId,
    //     address,
    //     uint256
    // ) external view returns (uint256) {
    //     return _fundable(cheqId);
    // }

    // // BUG what if funder doesnt fund the invoice for too long??
    // function cashable(
    //     uint256 cheqId,
    //     address caller,
    //     uint256 /* amount */
    // ) public view returns (uint256) {
    //     // Invoice funder can cash before period, cheq writer can cash before period
    //     // Chargeback case
    //     if (
    //         cheqFunder[cheqId] == caller &&
    //         (block.timestamp <
    //             cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])
    //     ) {
    //         // Funding party can rescind before the inspection period elapses
    //         return cheq.cheqEscrowed(cheqId);
    //     } else if (
    //         cheq.ownerOf(cheqId) == caller &&
    //         (block.timestamp >=
    //             cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])
    //     ) {
    //         // Receiving/Owning party can cash after inspection period
    //         return cheq.cheqEscrowed(cheqId);
    //     } else if (isReleased[cheqId]) {
    //         return cheq.cheqEscrowed(cheqId);
    //     } else {
    //         return 0;
    //     }
    // }

    // function cashCheq(uint256 cheqId, uint256 amount) public {
    //     // TODO: allow anyone to cash for someone?
    //     uint256 cashableAmount = cashable(cheqId, _msgSender(), amount);
    //     require(cashableAmount == amount, "Cant cash this amount");
    //     cheq.cash(cheqId, _msgSender(), amount);
    // }

    // function cashCheq(uint256 cheqId) public {
    //     uint256 cashableAmount = cashable(cheqId, _msgSender(), 0);
    //     cashCheq(cheqId, cashableAmount);
    // }

    // function _ownerOf(uint256 tokenId) internal view override returns (address) {
    //     return REGISTRAR.ownerOf(tokenId);
    // }

    // function _transfer(
    //     address from,
    //     address to,
    //     uint256 tokenId
    // ) internal virtual {
    //     require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
    //     require(to != address(0), "ERC721: transfer to the zero address");

    //     _beforeTokenTransfer(from, to, tokenId, 1);

    //     // Check that tokenId was not transferred by `_beforeTokenTransfer` hook
    //     require(ERC721.ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");

    //     // Clear approvals from the previous owner
    //     delete _tokenApprovals[tokenId];

    //     unchecked {
    //         // `_balances[from]` cannot overflow for the same reason as described in `_burn`:
    //         // `from`'s balance is the number of token held, which is at least one before the current
    //         // transfer.
    //         // `_balances[to]` could overflow in the conditions described in `_mint`. That would require
    //         // all 2**256 token ids to be minted, which in practice is impossible.
    //         _balances[from] -= 1;
    //         _balances[to] += 1;
    //     }
    //     _owners[tokenId] = to;

    //     emit Transfer(from, to, tokenId);

    //     _afterTokenTransfer(from, to, tokenId, 1);
    // }


    // function tokenURI(uint256 tokenId)
    //     public
    //     view
    //     returns (string memory)
    // { // override(ERC721, ICheqModuleV2)
    //     return string(abi.encodePacked(baseURI, tokenId));
    // }

    /** 
    Status(
        0: neither have started, 
        1: freelancer ready to start, 
        2: client ready for work to start, 
        3: work has started, 
        4: freelancer stopped,
        5: client stopped,
        6: both stopped,
        7: freelancer finished
        8: work completed and paid (freelancer finished and client has paid)
        )
    // enum Status {
    //     BothWaiting,
    //     FreelancerReady,
    //     ClientReady,
    //     BothReady,
    //     FreelancerDisputing,
    //     ClientDisputing,
    //     BothDisputing,
    //     Completed
    // }
     */