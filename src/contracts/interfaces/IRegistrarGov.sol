// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

interface IRegistrarGov {
    function moduleWhitelisted(address module)
        external
        view
        returns (bool, bool); // addressWhitelisted, bytecodeWhitelisted

    function tokenWhitelisted(address token) external view returns (bool);

    // Fees
    function getFees()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        );

    function moduleWithdraw(
        address token,
        uint256 amount,
        address payoutAccount
    ) external;
}
