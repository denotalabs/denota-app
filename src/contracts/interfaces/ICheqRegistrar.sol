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
    function write(DataTypes.Cheq calldata cheq, bytes calldata moduleWriteData, address owner) external payable returns (uint256);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory moduleTransferData) external;
    function approve(address to, uint256 tokenId) external;
    function fund(uint256 cheqId, uint256 amount, bytes calldata fundData) external payable;
    function cash(uint256 cheqId, uint256 amount, address to, bytes calldata cashData) external payable;
    function cheqInfo(uint256 cheqId) external view returns (DataTypes.Cheq memory);  // Question: Should this be the only _cheqInfo view method?
    function cheqAmount(uint256 cheqId) external view returns (uint256);
    function cheqCurrency(uint256 cheqId) external view returns (IERC20);
    function cheqDrawer(uint256 cheqId) external view returns (address);
    function cheqRecipient(uint256 cheqId) external view returns (address);
    function cheqEscrowed(uint256 cheqId) external view returns (uint256);
    function cheqModule(uint256 cheqId) external view returns (ICheqModule);
}