// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/token/ERC20/utils/SafeERC20.sol";
import {Events} from "./libraries/Events.sol";
import {DataTypes} from "./libraries/DataTypes.sol";
import {IRegistrarGov} from "./interfaces/IRegistrarGov.sol";

// Idea Registrar could take different fees from different modules. Business related ones would be charged but not social ones
contract RegistrarGov is Ownable, IRegistrarGov {
    using SafeERC20 for IERC20;
    mapping(address => mapping(address => uint256)) internal _moduleRevenue; // Could collapse this into a single mapping
    mapping(bytes32 => bool) internal _bytecodeWhitelist; // Question Can these be done without two mappings? Having both redeployable and static modules?
    mapping(address => bool) internal _addressWhitelist;
    mapping(address => bool) internal _tokenWhitelist;

    // uint256 public _writeFlatFee; // Question: is this needed?

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

    function validWrite(
        address module,
        address token
    ) public view returns (bool) {
        return _validModule(module) && _tokenWhitelist[token]; // Valid module and whitelisted currency
    }

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

    function moduleWhitelisted(
        address module
    ) public view returns (bool, bool) {
        return (
            _addressWhitelist[module],
            _bytecodeWhitelist[_returnCodeHash(module)]
        );
    }

    function tokenWhitelisted(address token) public view returns (bool) {
        return _tokenWhitelist[token];
    }
}
