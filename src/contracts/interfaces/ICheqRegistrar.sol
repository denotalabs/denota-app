// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import {DataTypes} from "../libraries/DataTypes.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import {ICheqModule} from "../interfaces/ICheqModule.sol";

/**
 * @notice CheqRegistrar handles: Whitelisting/?Deploying modules, Escrowing funds, and Storing cheq data
 * Question: Take Flat fees in gas through WFC and Percent through module and transfers (reduces cheq.escrowed)?
 * Question: Should process_() return non-booleans?
 * TODO: send cheq as a struct or individual variables?
 */
interface ICheqRegistrar {
    /// Cheq manipulations
    function write(DataTypes.Cheq calldata cheq, bytes calldata moduleWriteData, address owner) external payable returns (uint256);
    // function transferFrom(address from, address to, uint256 tokenId, bytes memory moduleTransferData) external; // Question: Should this be allowed?
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory moduleTransferData) external;
    function fund(uint256 cheqId, uint256 amount, bytes calldata fundData) external payable;
    function cash(uint256 cheqId, uint256 amount, address to, bytes calldata cashData) external payable;
    function approve(address to, uint256 tokenId) external;
    
    // Cheq data
    function cheqInfo(uint256 cheqId) external view returns (DataTypes.Cheq memory);  // Question: Should this be the only _cheqInfo view method?
    function cheqDrawerRecipient(uint256 cheqId) external view returns(address, address);
    function cheqCurrencyValueEscrow(uint256 cheqId) external view returns(address, uint256, uint256);
    function cheqDrawer(uint256 cheqId) external view returns (address);
    function cheqRecipient(uint256 cheqId) external view returns (address);
    function cheqCurrency(uint256 cheqId) external view returns (address);
    function cheqAmount(uint256 cheqId) external view returns (uint256);
    function cheqEscrowed(uint256 cheqId) external view returns (uint256);
    function cheqModule(uint256 cheqId) external view returns (address);
    // function totalSupply() public view returns (uint256);

    /// Whitlistings
    function ruleWhitelisted(address rule) external view returns (bool);
    function rulesWhitelisted(address writeRule, address transferRule, address fundRule, address cashRule, address approveRule) external view returns (bool);
    function moduleWhitelisted(address module) external view returns(bool, bool);  // addressWhitelisted, bytecodeWhitelisted
    function tokenWhitelisted(address token) external view returns(bool);

    // Fees
    function getFees() external view returns(uint256, uint256, uint256, uint256, uint256, uint256);
    function moduleWithdraw(address token, uint256 amount, address payoutAccount) external;
}