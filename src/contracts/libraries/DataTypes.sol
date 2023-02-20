// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;
import "openzeppelin/token/ERC20/IERC20.sol";

// Might be able to just incorporate this into the CheqRegistrar
library DataTypes {
    // Question: Should this be the core registrar params?
    struct CheqParams {
        address currency;
        uint256 escrowed;
        address module;
    }

    struct Cheq {
        address currency;
        uint256 amount; // Question: store on the module instead?
        uint256 escrowed;
        address drawer; // Question: store on the module instead?
        address recipient; // Question: store on the module instead?
        address module;
        uint256 mintTimestamp; // Set by caller and immutable

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
