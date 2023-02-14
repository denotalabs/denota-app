// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC20/IERC20.sol";

// Might be able to just incorporate this into the CheqRegistrar
library DataTypes {
    struct Cheq {
        address currency; // Set by caller [Wont change on hook]
        // Question: should `amount` be in registrar?
        uint256 amount; // Set by caller [Wont change on hook..?]  // Question why should/shouldnt this be immutable
        uint256 escrowed; // Set by caller [Changes]

        address drawer; // Immutable & arbitrarily settable [intended sender]
        address recipient; // Immutable & arbitrarily settable [intended claimer]

        address module; // Set by caller and immutable
        uint256 mintTimestamp;  // Not settable

        // bool isImmutable;  // IDEA: May add reliability by denying cheqs from being modifiable by their modules
        // bool isFungible; // IDEA: Allow escrowing a single NFT. Multiple would be more difficult since amount/escrowed == tokenId ? 0
    }

    struct WTFCFees {
        uint256 writeBPS;
        uint256 transferBPS;
        uint256 fundBPS;
        uint256 cashBPS;
    }
}
