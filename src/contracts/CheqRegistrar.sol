// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC20/IERC20.sol"; // TODO change to safe ERC20? Check interface?
import "openzeppelin/access/Ownable.sol";
import "./ICheqModule.sol";
import "./ERC721r.sol";

/**
Implications of:
Changing 721
User module whitelist
Architecture structure (inside-out OR outside-in)
Why have a deposits variable? Legal ramification of storing deposits, are we a bank?
 */
// TODO: No way to remove deposits without writing a check
// TODO: Burning?
// TODO: UpgradableProxy?
// TODO: Implement and check ICheqModule interface on write()
// TODO: Implement codeHash whitelisting to enable redeployment of modules
// TODO: Need to add withdraw functions for protocol fees
// TODO: change to `_escrows`? users may not deposit independent of write()
// TODO: Consider adding "zones" where zone operators can approve a bundle of modules for users who trust them. Can user only trust one at a time? How to approve new modules without operator doing so then?
// How to set version and/or chain deployment?
// Options:
//// Each deployment is it's own int.
//// Each chain is it's own int.
//// Some combination of the two

// 1. Ensure Write/Deposit checks ERC20 *interface* support
// 2. Make sure OpenSea integration works (see how OS tracks metadata)

// Assumes the module is paying for user, otherwise the user approved the module to use their funds
// but also requires:
// 1. token approve the registrar 2. deposit on user account 3. whitelist the module 4. module takes user funds on writeCheq() OR
// 1. approve module 2. module deposits to the user's account and writes cheq

/**
 * @title The Cheq Protocol registration contract
 * @author Alejandro Almaraz
 * @notice This contract executes writing, transfering, funding, and cashing of cheqs. It stores each cheq's metadata, user's their cheq ownership, escrowing of funds, and module whitelisting
 * @dev All functions except tokenURI(), write(), and deposit() can only be called by the cheq's payment module
 */
contract CheqRegistrar is ERC721r, Ownable {
    /** 
     * @notice Each cheq's metadata such as: the drawer, recipient, token, face value, escrowed amount, and the payment terms module address.
     * @dev The metadata is stored in the _cheqInfo variable and queryable using the relevant getter functions 
    */
    struct Cheq {
        IERC20 token; // Immutable
        uint256 amount; // Immutable & arbitrarily settable
        uint256 escrowed; // Mutable but invariant w.r.t deposits [MOST VULNERABLE]
        address drawer; // Immutable & arbitrarily settable [intended sender]
        address recipient; // Immutable & arbitrarily settable [intended claimer]
        ICheqModule module; // Immutable & not settable
        // bool isFungible; // to allow escrowing a single NFT. Multiple would be more difficult since amount/escrowed == tokenId
    }
    /*//////////////////////////////////////////////////////////////
                           STORAGE VARIABLES
    //////////////////////////////////////////////////////////////*/
    /** 
     * @dev The cheq ID to cheq metadata mapping set upon cheq writing and partly modifiable by the module defined in the module field. IDs are incremented by one with no cap
    */
    mapping(uint256 => Cheq) private _cheqInfo; // Cheq information
    /** 
     * @dev the user's token deposits which are accessed by modules to write cheqs
    */
    mapping(address => mapping(IERC20 => uint256)) private _deposits; // Total user deposits
    /** 
     * @dev the whitelist that enables CheqModules to WTFC cheqs. Currently, whitelisting is performed by users who grant each module access to their deposits
    */
    mapping(address => mapping(ICheqModule => bool))
        private _userModuleWhitelist; // Total user deposits
    uint256 private feeChangeDate;
    uint256 private feeChangeCooldown;
    uint256 private _totalSupply; // Total cheqs created
    uint256 private writeFlatFee;
    uint256 private transferFlatFee;
    uint256 private fundFlatFee;
    uint256 private cashFlatFee;
    uint256 private depositFlatFee;
    
    /*//////////////////////////////////////////////////////////////
                           EVENTS/MODIFIERS
    //////////////////////////////////////////////////////////////*/
    event Deposited(IERC20 indexed token, address indexed to, uint256 amount);
    /** 
     * @dev the amount, drawer, recipient, and payer can be arbitrarily set by the module but not modified afterwards
    */
    event Written(
        uint256 indexed cheqId,
        IERC20 token,
        uint256 amount,
        uint256 escrowed,
        address indexed drawer,
        address recipient,
        address payer, 
        ICheqModule indexed module
    );
    // event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Funded(uint256 indexed cheqId, address indexed from, uint256 amount);
    event Cashed(uint256 indexed cheqId, address indexed to, uint256 amount);
    event ModuleWhitelisted(
        address indexed user,
        ICheqModule indexed module,
        bool isAccepted
    );

    /** 
     * @dev modifier that prevents WTFC from accounts that aren't the specified cheq's module address
    */
    modifier onlyModule(uint256 cheqId) {
        require(
            _msgSender() == address(_cheqInfo[cheqId].module),
            "Only cheq's module"
        );
        _;
    }
    modifier userWhitelisted(ICheqModule module) {
        require(
            _userModuleWhitelist[_msgSender()][module],
            "Only whitelisted modules"
        );
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        ONLY OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @dev Initializes the contract by setting`name`, `symbol` and protocol fee variables.
     */
    constructor(
        uint256 _writeFlatFee,
        uint256 _transferFlatFee,
        uint256 _fundFlatFee,
        uint256 _cashFlatFee,
        uint256 _depositFlatFee
    ) ERC721r("CheqProtocol", "CHEQ") {
        writeFlatFee = _writeFlatFee;
        transferFlatFee = _transferFlatFee;
        fundFlatFee = _fundFlatFee;
        cashFlatFee = _cashFlatFee;
        depositFlatFee = _depositFlatFee;
        feeChangeDate = block.timestamp;
        feeChangeCooldown = 52 weeks;
    }
    /**
     * @dev Allows the owner to set the fee parameters for WTFCD and can modify the fee change cooldown
     */
    function changeFees(
        uint256 _writeFlatFee,
        uint256 _transferFlatFee,
        uint256 _fundFlatFee,
        uint256 _cashFlatFee,
        uint256 _depositFlatFee, 
        uint256 _feeChangeCooldown
    ) external onlyOwner {
        require(feeChangeDate + feeChangeCooldown <= block.timestamp, "TOO_SOON");
        feeChangeDate = block.timestamp;
        feeChangeCooldown = _feeChangeCooldown;
        writeFlatFee = _writeFlatFee;
        transferFlatFee = _transferFlatFee;
        fundFlatFee = _fundFlatFee;
        cashFlatFee = _cashFlatFee;
        depositFlatFee = _depositFlatFee;
    }

    /*//////////////////////////////////////////////////////////////
                        OWNERSHIP FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @dev This allows any module that is whitelisted to access the user's deposit pool. This is equivalent to giving them an infinite approval but is better UX
     */
    function whitelistModule(ICheqModule module, bool isAccepted) external { // Allow non-_msgSender()?
        _userModuleWhitelist[_msgSender()][module] = isAccepted;
        emit ModuleWhitelisted(_msgSender(), module, isAccepted);
    }

    /**
     * @dev takes fee, checks if funder allows this module, deducts their balance, initializes the cheqInfo struct using the totalSupply int, mints the cheq using ERC721 _mint(), and updates the total supply
     */
    function write(  // Add `payer` address to differentiate the balance being removed
        address payer,
        address drawer,
        address recipient,
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address owner
    ) public payable returns (uint256) {
        require(msg.value >= writeFlatFee, "INSUF_FEE");
        // ICheqModule module = ICheqModule(_msgSender());  // TODO Does this work on an EOA?  // TODO: stack too deep
        // require(module.supportInterface("0xffffffff"), "INVAL_MODULE");
        if (payer != _msgSender()) {
            // The module is trying to use `from` deposit on their behalf instead of its own
            // TODO: explaining this is important
            require(_userModuleWhitelist[payer][ICheqModule(_msgSender())], "UNAPP_MODULE"); // See if user allows this
        }
        require(escrow <= _deposits[payer][_token], "INSUF_BAL");
        unchecked {_deposits[payer][_token] -= escrow;} // Deduct address balance
        _cheqInfo[_totalSupply] = Cheq({
            token: _token,
            amount: amount,
            escrowed: escrow,
            drawer: drawer,
            recipient: recipient,
            module: ICheqModule(_msgSender())
        });
        _safeMint(owner, _totalSupply);  // TODO: safeMint()?
        emit Written(
            _totalSupply,
            _token,
            amount,
            escrow,
            drawer,
            recipient,
            payer,
            ICheqModule(_msgSender())
        );
        unchecked {
            _totalSupply += 1;
        }
        return _totalSupply - 1;
    }
    /**
     * @dev checks if caller is the cheq's module, takes the transfer fee, calls ERC721's _transfer() function
     */
    function transferFrom(
        // TODO ensure the override is correct
        address from,
        address to,
        uint256 cheqId
    ) public payable override onlyModule(cheqId) {
        require(msg.value >= transferFlatFee, "INSUF_FEE");
        _transfer(from, to, cheqId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 cheqId
    ) public payable override onlyModule(cheqId) {
        require(msg.value >= transferFlatFee, "INSUF_FEE");
        _safeTransfer(from, to, cheqId, "");
    }

    /*//////////////////////////////////////////////////////////////
                          ESCROW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @dev checks if caller is the cheq's module, takes fund fee, deducts balance from the funders token deposit, increments the cheq's escrow amount
     */
    function fund(
        uint256 cheqId,
        address from,
        uint256 amount
    ) external payable onlyModule(cheqId) {  // TODO: maybe fund using a new deposit()?
        // `From` can originate from anyone, module specifies whose balance it is removing from though
        require(msg.value >= fundFlatFee, "INSUF_FEE");
        Cheq storage cheq = _cheqInfo[cheqId];
        IERC20 _token = cheq.token;
        require(amount <= _deposits[from][_token], "INSUF_BAL");
        unchecked {
            _deposits[from][_token] -= amount;
        }
        cheq.escrowed += amount;
        emit Funded(cheqId, from, amount);
    }
    /**
     * @dev checks if caller is the cheq's module, takes cash fee, deducts the cheq's escrow amount, transfers the `to` address the cashAmount of their token
     */
    function cash(
        uint256 cheqId,
        address to,
        uint256 cashAmount
    ) external payable onlyModule(cheqId) {
        require(msg.value >= cashFlatFee, "INSUF_FEE");
        Cheq storage cheq = _cheqInfo[cheqId];
        require(cheq.escrowed >= cashAmount, "Can't cash more than available");
        unchecked {
            cheq.escrowed -= cashAmount;
        }
        require(cheq.token.transfer(to, cashAmount), "Transfer failed");  // TODO: safeCash()?
        emit Cashed(cheqId, to, cashAmount);
    }
    /**
     * @dev internal function for depositing to the `to` address. Takes deposit fee, calls token.transferFrom from `from` to the registrar, adds to the user's deposits balance. Assumes people will deposit onto registrar separate from escrowing cheqs which may be deprecated
     */
    function _deposit(
        IERC20 token,
        address to,
        uint256 amount
    ) private {
        require(msg.value >= depositFlatFee, "INSUF_FEE");
        require(
            token.transferFrom(
                _msgSender(), // transfers from `_msgSender()` to `address(this)` first checking if  _msgSender() approves address(this)
                address(this),
                amount
            ),
            "Transfer failed"
        );
        _deposits[to][token] += amount;
        emit Deposited(token, to, amount);
    }
    /**
     * @dev deposits to _msgSender()'s deposits
     */
    function deposit(IERC20 _token, uint256 _amount)
        external
        payable
        returns (bool)
    {
        _deposit(_token, _msgSender(), _amount); // Only makes sense for
        return true;
    }
    /**
     * @dev deposits from the _msgSender() to the `to` account's deposits
     */
    function deposit(
        IERC20 token,
        address to,
        uint256 amount
    ) public payable returns (bool) {
        _deposit(token, to, amount);
        return true;
    }
    /**
     * @dev convenience function for modules to write a check when the payer has no balance on the registrar
     */
    function depositWrite(
        address payer, // Person putting up the escrow
        address drawer, // Person sending the cheq. If `payer`!=`drawer`, payer must approve module
        address recipient,
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address owner
    ) external payable returns (uint256) {
        _deposit(_token, payer, escrow); // TODO: Make a require with bool success?
        return write(payer, drawer, recipient, _token, amount, escrow, owner);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function cheqInfo(uint256 cheqId) public view returns (Cheq memory) {
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

    function deposits(address user, IERC20 token)
        public
        view
        returns (uint256)
    {
        return _deposits[user][token];
    }
    function userModuleWhitelist(address user, ICheqModule module)
        public
        view
        returns (bool)
    {
        return _userModuleWhitelist[user][module];
    }
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }
    /**
     * @dev returns the cheqInfo metadata in JSON format. Enables OpenSea and other marketplaces to pull the cheq's information independent to it's module
     */
    function buildMetadata(uint256 _tokenId)
        private
        view
        returns (string memory)
    {
        Cheq memory cheq = cheqInfo(_tokenId);
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
                                    // CheqProtocol is a marketplace of payment terms to help you transact your way!,
                                    // '", "image": "',
                                    // "data:image/svg+xml;base64,",
                                    // buildImage(_tokenId),
                                    ", \"attributes\": ",
                                    "[",
                                        "{\"trait_type\": \"Token\",", "\"value\":", cheq.token, "}",
                                        "{\"trait_type\": \"Amount\",", "\"value\":", cheq.amount, "}",
                                        "{\"trait_type\": \"Escrowed\",", "\"value\":", cheq.escrowed, "}",
                                        "{\"trait_type\": \"Drawer\",", "\"value\":", cheq.drawer, "}",
                                        "{\"trait_type\": \"Recipient\",", "\"value\":", cheq.recipient, "}",
                                        "{\"trait_type\": \"Module\",", "\"value\":", cheq.module, "}",
                                    "]",
                                "}"
                            )
                        )
                    )
                )
            );
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireMinted(_tokenId);
        return buildMetadata(_tokenId);
    }

    /*//////////////////////////////////////////////////////////////
                           BASE64 FUNCTIONS
    //////////////////////////////////////////////////////////////*/
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
