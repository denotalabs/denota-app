// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC20/IERC20.sol";

// Might be able to just incorporate this into the CheqRegistrar
library DataTypes {
    struct Cheq {
        address currency; // Immutable
        uint256 amount; // Immutable & arbitrarily settable
        uint256 escrowed; // Mutable but invariant w.r.t deposits [MOST VULNERABLE]
        // address owner; 
        address drawer; // Immutable & arbitrarily settable [intended sender]
        address recipient; // Immutable & arbitrarily settable [intended claimer]
        address module; // Immutable & not settable
        uint256 mintTimestamp;
        // bool isImmutable;  // IDEA: May add reliability by denying cheqs from being modifiable by their modules
        // bool isFungible; // IDEA: Allow escrowing a single NFT. Multiple would be more difficult since amount/escrowed == tokenId ? 0
    }
}
