// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {Events} from "../contracts/libraries/Events.sol";
import {RegistrarGov} from "../contracts/RegistrarGov.sol";
import {DataTypes} from "../contracts/libraries/DataTypes.sol";
import {ICheqModule} from "../contracts/interfaces/ICheqModule.sol";
import {ICheqRegistrar} from "../contracts/interfaces/ICheqRegistrar.sol";
import {CheqBase64Encoding} from "../contracts/libraries/CheqBase64Encoding.sol";

/**
     Ownable  IRegistrarGov
          \      /
        RegistrarGov ICheqRegistrar ERC721
                    \      |       /
                      CheqRegistrar
 */

/**
 * @title  The Cheq Payment Registrar
 * @notice The main contract where users can WTFCA cheqs
 * @author Alejandro Almaraz
 * @dev    Tracks ownership of cheqs' data + escrow, whitelists tokens/modules/rulesets, and collects revenue.
 */
// Question: will we be making many, custom made models, or try to make them as general as possible?
contract CheqRegistrar is
    ERC721,
    RegistrarGov,
    ICheqRegistrar,
    CheqBase64Encoding
{
    using SafeERC20 for IERC20;

    mapping(uint256 => DataTypes.Cheq) private _cheqInfo;
    uint256 private _totalSupply;

    error Disallowed();
    error SendFailed();
    error SelfApproval();
    error InsufficientValue(uint256);
    error InvalidWrite(address, address);
    error InsufficientEscrow(uint256, uint256);

    constructor() ERC721("denota", "NOTA") {}

    function write(
        address currency,
        uint256 escrowed,
        uint256 instant, // if nonFungible is supported make sure this can't be used
        address owner,
        address module,
        bytes calldata moduleWriteData
    ) public payable returns (uint256) {
        // require(msg.value >= _writeFlatFee, "INSUF_FEE"); // IDEA: discourages spamming of 0 value cheqs
        if (!validWrite(module, currency))
            revert InvalidWrite(module, currency); // Module+token whitelist check

        // Module hook (updates its storage, gets the fee)
        uint256 moduleFee = ICheqModule(module).processWrite(
            _msgSender(),
            owner,
            _totalSupply,
            currency,
            escrowed,
            instant,
            moduleWriteData
        );

        _transferTokens(escrowed, instant, currency, owner, moduleFee, module);

        _safeMint(owner, _totalSupply);
        _cheqInfo[_totalSupply].currency = currency;
        _cheqInfo[_totalSupply].escrowed = escrowed;
        _cheqInfo[_totalSupply].createdAt = block.timestamp; // This necessary?
        _cheqInfo[_totalSupply].module = module;

        emit Events.Written(
            _msgSender(),
            _totalSupply,
            owner,
            instant,
            currency,
            escrowed,
            block.timestamp,
            moduleFee,
            module,
            moduleWriteData
        );
        unchecked {
            return _totalSupply++;
        } // NOTE: Will this ever overflow?
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory moduleTransferData
    ) public override(ERC721, ICheqRegistrar) {
        address owner = ownerOf(tokenId); // require(from == owner,  "") ?
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
            cheq.escrowed = cheq.escrowed - moduleFee;
            _moduleRevenue[cheq.module][cheq.currency] += moduleFee;
            emit Events.Transferred(
                tokenId,
                owner,
                to,
                moduleFee,
                block.timestamp
            );
        } else {
            // Must be case since fee's can't be taken without an escrow to take from
            emit Events.Transferred(tokenId, owner, to, 0, block.timestamp);
        }

        _safeTransfer(from, to, tokenId, "");
    }

    function fund(
        uint256 cheqId,
        uint256 amount,
        uint256 instant,
        bytes calldata fundData
    ) external payable {
        DataTypes.Cheq storage cheq = _cheqInfo[cheqId]; // TODO check that token exists
        address owner = ownerOf(cheqId); // Is used twice

        // Module hook
        uint256 moduleFee = ICheqModule(cheq.module).processFund(
            _msgSender(),
            owner,
            amount,
            instant,
            cheqId,
            cheq,
            fundData
        );

        // Fee taking and escrow
        _transferTokens(
            cheq.escrowed,
            instant,
            cheq.currency,
            owner,
            moduleFee,
            cheq.module
        );

        emit Events.Funded(
            _msgSender(),
            cheqId,
            amount,
            instant,
            fundData,
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
        uint256 moduleFee = ICheqModule(cheq.module).processCash(
            _msgSender(),
            ownerOf(cheqId),
            to,
            amount,
            cheqId,
            cheq,
            cashData
        );

        // Fee taking
        uint256 totalAmount = amount + moduleFee;

        // Un-escrowing
        if (totalAmount > cheq.escrowed)
            revert InsufficientEscrow(totalAmount, cheq.escrowed);
        unchecked {
            cheq.escrowed -= totalAmount;
        } // Could this just underflow and revert anyway (save gas)?
        if (cheq.currency == address(0)) {
            (bool sent, ) = to.call{value: amount}("");
            if (!sent) revert SendFailed();
        } else {
            IERC20(cheq.currency).safeTransfer(to, amount);
        }
        _moduleRevenue[cheq.module][cheq.currency] += moduleFee;

        emit Events.Cashed(
            _msgSender(),
            cheqId,
            to,
            amount,
            cashData,
            moduleFee,
            block.timestamp
        );
    }

    function approve(
        address to,
        uint256 tokenId
    ) public override(ERC721, ICheqRegistrar) {
        if (to == _msgSender()) revert SelfApproval();

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

    function tokenURI(
        uint256 _tokenId
    ) public view override returns (string memory) {
        _requireMinted(_tokenId);

        string memory _tokenData = ICheqModule(_cheqInfo[_tokenId].module)
            .processTokenURI(_tokenId);

        return
            buildMetadata(
                toString(_cheqInfo[_tokenId].currency),
                itoa(_cheqInfo[_tokenId].escrowed),
                toString(_cheqInfo[_tokenId].module),
                _tokenData
            );
    }

    function _transferTokens(
        uint256 escrowed,
        uint256 instant,
        address currency,
        address owner,
        uint256 moduleFee,
        address module
    ) private {
        uint256 totalAmount = escrowed + instant;
        if (totalAmount != 0) {
            // Module forces user to escrow moduleFee, even when escrowed == 0
            uint256 toEscrow = escrowed + moduleFee;
            if (toEscrow > 0) {
                if (currency == address(0)) {
                    if (msg.value < toEscrow)
                        // Downside is user must send value in this case, whereas ERC20 only requires sufficient approval
                        revert InsufficientValue(msg.value);
                } else {
                    IERC20(currency).safeTransferFrom(
                        _msgSender(),
                        address(this),
                        toEscrow
                    );
                }
            }
            if (instant > 0) {
                if (currency == address(0)) {
                    if (msg.value != toEscrow)
                        revert InsufficientValue(msg.value);
                    (bool sent, ) = owner.call{value: msg.value}("");
                    if (!sent) revert SendFailed();
                } else {
                    IERC20(currency).safeTransferFrom(
                        _msgSender(),
                        owner,
                        instant
                    );
                }
            }
            _moduleRevenue[module][currency] += moduleFee;
        }
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        // Removed the approveOrOwner check, allow module to decide
        safeTransferFrom(from, to, tokenId, "");
    }

    function setApprovalForAll(
        address /*operator*/,
        bool /*approved*/
    ) public pure override {
        revert Disallowed(); // Question: Does OS require operators?
        // _setApprovalForAll(_msgSender(), operator, approved);
    }

    /*//////////////////////////////////////////////////////////////
                                VIEW
    //////////////////////////////////////////////////////////////*/
    function cheqInfo(
        uint256 cheqId
    ) public view returns (DataTypes.Cheq memory) {
        _requireMinted(cheqId);
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

    function cheqCreatedAt(uint256 cheqId) public view returns (uint256) {
        return _cheqInfo[cheqId].createdAt;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    // function ownerOf(uint256 tokenId) public view override returns (address) {
    //     address owner = _ownerOf(tokenId);
    //     // return ICheqModule(_cheqInfo[tokenId].module).processOwnerOf(_msgSender(), tokenId);
    // }

    // function balanceOf(address owner) public view override returns (uint256) {
    //     // uint256 tokenBalance = module.processBalanceOf(owner); // takes into consideration blacklisted
    // }
}
