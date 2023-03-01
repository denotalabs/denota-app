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
 * @title  The Cheq Payment Registrar
 * @notice The main contract where users can WTFCA cheqs
 * @author Alejandro Almaraz
 * @dev    Tracks ownership of cheqs' data + escrow, whitelists tokens/modules/rulesets, and collects revenue.
 */

// Revert if frontend gives the wrong amount (MM should know if it would revert (using Ethers call estimateGas, will also tell you if it will revert))
// Note Arseniy: "calling contracts may not be able to convert their storage to calldata when calling functions" "developers want to develop if we already have a lot of users and they can make money from fees, or " // deploy your own DAO and see how difficult it is
// Question what would a gnosis app need?
// Question accept native token using address(0) as it's address? Or use wrapped version?
// Question Create a module labeling schema?
// Question: Add function to deploy modules from the registrar?
// Question: Implement ownerOf(cheqId) { cheq.module.processOwner(); } to allow ownership revokation?

// Question should registrar have a function payload(cheqid, bytes) to forward updates to the cheq's respective module for easier front-end manipulation?
// TODO support burning (from registrar and module)
// TODO add WTFCA EIP712 signature methods
// TODO ensure BPS avoids over/underflow
// TODO need to convert IWTFCRules to libraries
// TODO determine proper fee uint sizes
// TODO need to implement upgradable proxies
// TODO make sure tokenURI is working
// TODO TODO modify ERC721 to allow non owner/approved/operators to call transferFrom (let module decide)
// TODO allow batched usage of functions
contract CheqRegistrar is ERC721, Ownable, ICheqRegistrar {
    using SafeERC20 for IERC20;
    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/
    mapping(uint256 => DataTypes.Cheq) private _cheqInfo;
    uint256 private _totalSupply;

    mapping(bytes32 => bool) private _bytecodeWhitelist; // Question Can these be done without two mappings? Having both redeployable and static modules?
    mapping(address => bool) private _addressWhitelist;
    mapping(address => bool) private _tokenWhitelist;

    mapping(address => mapping(address => uint256)) private _moduleRevenue; // Could collapse this into a single mapping
    mapping(address => uint256) private _registrarRevenue;
    uint256 internal constant BPS_MAX = 10_000; // TODO Lens uses uint16
    DataTypes.WTFCFees public fees;
    uint256 public _writeFlatFee; // Question: is this needed?

    constructor(DataTypes.WTFCFees memory _fees)
        ERC721("CheqProtocol", "CHEQ")
    {
        fees = _fees;
    }

    /*//////////////////////////////////////////////////////////////
                              
    //////////////////////////////////////////////////////////////*/
    function validWrite(address module, address token)
        public
        view
        returns (bool)
    {
        return _validModule(module) && _tokenWhitelist[token]; // Valid module and whitelisted currency
    }

    function write(
        address currency,
        uint256 escrowed,
        uint256 instant, // if nonFungible is supported make sure this can't be used
        address owner,
        address module,
        bytes calldata moduleWriteData
    ) public payable returns (uint256) {
        // require(msg.value >= _writeFlatFee, "INSUF_FEE"); // Question should flat fee be implemented?
        require(validWrite(module, currency), "NOT_WHITELISTED"); // Module+token whitelist check

        // Module hook
        uint256 moduleFee = ICheqModule(module).processWrite(
            _msgSender(),
            owner,
            _totalSupply,
            currency,
            escrowed,
            instant,
            moduleWriteData
        );

        uint256 cheqFee;
        {
            // Fee taking and escrowing
            uint256 totalAmount = escrowed + instant; // TODO could optimize when 0
            cheqFee = (totalAmount * fees.writeBPS) / BPS_MAX; // uint256 totalBPS = fees.writeBPS + moduleBPS; but need to emit and add to reserves
            uint256 toEscrow = escrowed + cheqFee + moduleFee;
            if (toEscrow > 0) {
                IERC20(currency).safeTransferFrom(
                    _msgSender(),
                    address(this),
                    toEscrow
                );
                _registrarRevenue[currency] += cheqFee;
                _moduleRevenue[module][currency] += moduleFee;
            }
            if (instant > 0)
                IERC20(currency).safeTransferFrom(_msgSender(), owner, instant);
        }

        // Cheq Minting  // Question put this before or after escrow?
        _safeMint(owner, _totalSupply);
        _cheqInfo[_totalSupply].currency = currency;
        _cheqInfo[_totalSupply].escrowed = escrowed;
        _cheqInfo[_totalSupply].createdAt = block.timestamp;
        _cheqInfo[_totalSupply].module = module;

        emit Events.Written(
            _totalSupply,
            owner,
            instant,
            currency,
            escrowed,
            block.timestamp,
            cheqFee,
            moduleFee,
            module,
            moduleWriteData
        );
        unchecked {
            return _totalSupply++;
        } // NOTE: Will this ever overflow?
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
        DataTypes.Cheq storage cheq = _cheqInfo[tokenId]; // Better to assign than to index?

        // Module hook
        uint256 moduleFee = ICheqModule(cheq.module).processTransfer(
            _msgSender(),
            getApproved(tokenId),
            owner,
            from, // TODO Might not be needed
            to,
            tokenId,
            cheq.currency,
            cheq.escrowed,
            cheq.createdAt,
            moduleTransferData
        );

        // Fee taking and escrowing
        if (cheq.escrowed > 0) {
            // Can't take from 0 escrow
            uint256 cheqFee = (cheq.escrowed * fees.transferBPS) / BPS_MAX;
            cheq.escrowed = cheq.escrowed - cheqFee - moduleFee;
            _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
            _registrarRevenue[cheq.currency] += cheqFee;
            emit Events.Transferred(
                tokenId,
                owner,
                to,
                cheqFee,
                moduleFee,
                block.timestamp
            );
        } else {
            // Must be case since fee's can't be taken without an escrow to take from
            emit Events.Transferred(tokenId, owner, to, 0, 0, block.timestamp);
        }

        _safeTransfer(from, to, tokenId, "");
    }

    function fund(
        uint256 cheqId,
        uint256 amount,
        uint256 instant,
        bytes calldata fundData
    ) external payable {
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];
        address owner = ownerOf(cheqId); // Is used twice

        // Module hook
        uint256 moduleBPS = ICheqModule(cheq.module).processFund(
            _msgSender(),
            owner,
            amount,
            instant,
            cheqId,
            cheq,
            fundData
        );

        // Fee taking and escrow
        uint256 totalAmount = amount + instant;
        uint256 cheqFee = (totalAmount * fees.writeBPS) / BPS_MAX; // uint256 totalBPS = fees.writeBPS + moduleBPS; but need to emit and add to reserves
        uint256 moduleFee = (totalAmount * moduleBPS) / BPS_MAX;
        uint256 toEscrow = amount + cheqFee + moduleFee;
        if (toEscrow > 0) {
            IERC20(cheq.currency).safeTransferFrom(
                _msgSender(),
                address(this),
                toEscrow
            );
            _registrarRevenue[cheq.currency] += cheqFee;
            _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
        }
        if (instant > 0)
            IERC20(cheq.currency).safeTransferFrom(
                _msgSender(),
                owner,
                instant
            );

        emit Events.Funded(
            _msgSender(),
            cheqId,
            amount,
            instant,
            fundData,
            cheqFee,
            moduleFee,
            block.timestamp
        );
    }

    function cash(
        uint256 cheqId,
        uint256 amount,
        address to,
        bytes calldata cashData
    ) external payable {
        // Should percent fee work here too?
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId];

        // Module Hook
        uint256 moduleBPS = ICheqModule(cheq.module).processCash(
            _msgSender(),
            ownerOf(cheqId),
            to,
            amount,
            cheqId,
            cheq,
            cashData
        );

        // Fee taking
        uint256 cheqFee = (amount * fees.cashBPS) / BPS_MAX;
        uint256 moduleFee = (amount * moduleBPS) / BPS_MAX;
        uint256 totalAmount = amount + cheqFee + moduleFee;

        // Un-escrowing
        require(cheq.escrowed >= totalAmount, "CANT_CASH_AMOUNT"); // TODO may cause funds to be stuck if fees are added
        unchecked {
            cheq.escrowed -= totalAmount;
        } // Could this just underflow and revert anyway to save gas?
        IERC20(cheq.currency).safeTransfer(to, amount);
        _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
        _registrarRevenue[cheq.currency] += cheqFee;

        emit Events.Cashed(
            _msgSender(),
            cheqId,
            to,
            amount,
            cashData,
            cheqFee,
            moduleFee,
            block.timestamp
        );
    }

    function approve(address to, uint256 tokenId)
        public
        override(ERC721, ICheqRegistrar)
    {
        require(to != _msgSender(), "SELF_APPROVAL");

        // Module hook
        DataTypes.Cheq memory cheq = _cheqInfo[tokenId];
        ICheqModule(cheq.module).processApproval(
            _msgSender(),
            ownerOf(tokenId),
            to,
            tokenId,
            cheq,
            ""
        );

        // Approve
        _approve(to, tokenId);
    }

    function setApprovalForAll(
        address, /*operator*/
        bool /*approved*/
    ) public pure override {
        // Question: Does OS require operators?
        require(false, "OPERATORS_NOT_SUPPORTED");
        // _setApprovalForAll(_msgSender(), operator, approved);
    }

    /*//////////////////////////////////////////////////////////////
                            FEE FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function updateFees(DataTypes.WTFCFees calldata _fees) external onlyOwner {
        fees = _fees;
    }

    function moduleWithdraw(
        address token,
        uint256 amount,
        address to
    ) external {
        require(_moduleRevenue[_msgSender()][token] >= amount, "INSUF_FUNDS");
        unchecked {
            _moduleRevenue[_msgSender()][token] -= amount;
        }
        IERC20(token).safeTransferFrom(address(this), to, amount);
    }

    function getFees()
        public
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (fees.writeBPS, fees.transferBPS, fees.fundBPS, fees.cashBPS);
    }

    function getTotalFees(uint256 cheqId, uint8 _WTFC)
        public
        view
        returns (uint256, uint256)
    {
        (uint256 wf, uint256 tf, uint256 ff, uint256 cf) = getFees(); // TODO there has to be a better way
        uint256[4] memory registrarFees;
        registrarFees = [wf, tf, ff, cf];

        (uint256 mwf, uint256 mtf, uint256 mff, uint256 mcf) = ICheqModule(
            _cheqInfo[cheqId].module
        ).getFees();
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
    ) external onlyOwner {
        // Whitelist either bytecode or address
        require(
            bytecodeAccepted != addressAccepted || // Can't accept both, but
                !(bytecodeAccepted || addressAccepted), // can revoke both
            "CAN'T_ACCEPT_BOTH"
        );
        _bytecodeWhitelist[_returnCodeHash(module)] = bytecodeAccepted;
        _addressWhitelist[module] = addressAccepted;
        emit Events.ModuleWhitelisted(
            _msgSender(),
            module,
            bytecodeAccepted,
            addressAccepted,
            block.timestamp
        );
    }

    function whitelistToken(address _token, bool accepted) external onlyOwner {
        // Whitelist for safety, modules can be more restrictive
        _tokenWhitelist[_token] = accepted;
        emit Events.TokenWhitelisted(
            _msgSender(),
            _token,
            accepted,
            block.timestamp
        );
    }

    function _returnCodeHash(address module) public view returns (bytes32) {
        bytes32 moduleCodeHash;
        assembly {
            moduleCodeHash := extcodehash(module)
        }
        return moduleCodeHash;
    }

    function _validModule(address module) internal view returns (bool) {
        return
            _addressWhitelist[module] ||
            _bytecodeWhitelist[_returnCodeHash(module)];
    }

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
    function cheqInfo(uint256 cheqId)
        public
        view
        returns (DataTypes.Cheq memory)
    {
        return _cheqInfo[cheqId];
    }

    function cheqCurrency(uint256 cheqId) public view returns (address) {
        return _cheqInfo[cheqId].currency;
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

    function moduleWhitelisted(address module)
        public
        view
        returns (bool, bool)
    {
        return (
            _addressWhitelist[module],
            _bytecodeWhitelist[_returnCodeHash(module)]
        );
    }

    function tokenWhitelisted(address token) public view returns (bool) {
        return _tokenWhitelist[token];
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        // Question: Should this switch case depend on if module has their own tokenURI()?
        _requireMinted(_tokenId);
        DataTypes.Cheq memory cheq = cheqInfo(_tokenId);
        string memory _tokenURI = ICheqModule(cheq.module).processTokenURI(
            _tokenId
        );

        if (bytes(_tokenURI).length == 0) {
            return
                CheqBase64Encoding.buildMetadata(
                    _tokenId,
                    cheq.currency,
                    cheq.escrowed,
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
