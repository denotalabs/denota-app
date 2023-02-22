// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/access/Ownable.sol";
import {Events} from "../contracts/libraries/Events.sol";

contract RegistrarWhitelisting is Ownable {
    mapping(bytes32 => bool) private _bytecodeWhitelist; // Question Can these be done without two mappings? Having both redeployable and static modules?
    mapping(address => bool) private _addressWhitelist;
    mapping(address => bool) private _ruleWhitelist; // Question make these bytecode specific? Rule specific?
    mapping(address => bool) private _tokenWhitelist;

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

    function whitelistRule(address rule, bool accepted) external onlyOwner {
        _ruleWhitelist[rule] = accepted;
        emit Events.RuleWhitelisted(
            _msgSender(),
            rule,
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

    function _validWrite(address module, address _token)
        internal
        view
        returns (bool)
    {
        return _validModule(module) && _tokenWhitelist[_token]; // Valid module and whitelisted currency
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

    function ruleWhitelisted(address rule) external view returns (bool) {
        return _ruleWhitelist[rule];
    }

    function rulesWhitelisted(
        address writeRule,
        address transferRule,
        address fundRule,
        address cashRule,
        address approveRule
    ) external view returns (bool) {
        return
            _ruleWhitelist[writeRule] &&
            _ruleWhitelist[transferRule] &&
            _ruleWhitelist[fundRule] &&
            _ruleWhitelist[cashRule] &&
            _ruleWhitelist[approveRule];
    }
}
