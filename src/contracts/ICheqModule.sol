// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

interface ICheqModule {
    /// Writing a cheq usually contains more or different variables that can't be uniformly standardized. 
    /// Perhaps create some supports interfaces for different kinds of basic contracts (BYOA, TIMELOCK, etc)
    //// function isWriteable(address sender, IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) external view returns(bool);
    //// function writeCheq(IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) external returns(uint256);
    // Checks if caller has enough balance [CRX]
    // Deducts user balance [CRX]
    // Initializes cheqInfo [CRX]
    // Emits Written [CRX]
    // Mints Cheq [CRX]
    // Increments totalSupply [CRX]
    // Returns cheqId [CRX]
    // Updates the broker contract's variables
    
    function isTransferable(uint256 cheqId, address caller, address to) external view returns(bool);
    function transferCheq(uint256 cheqId, address to) external;

    function fundable(uint256 cheqId, address caller, uint256 amount) external view returns(uint256);
    function fundCheq(uint256 cheqId, uint256 amount) external;
    
    function cashable(uint256 cheqId, address caller, uint256 amount) external view returns(uint256);  // How much can be cashed
    function cashCheq(uint256 cheqId, uint256 amount) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);
    // baseURI
    // _setTokenURI
    // _setBaseURI
    
    // Checks if caller is the owner [INTERFACE: broker]
    // Checks if is cashable [INTERFACE: broker]
    // Transfers the cashing amount [Cheq]
    // Emits Cash event [Cheq]
    // Checks if caller is auditor [INTERFACE]
    // Cashes balance back to drawer
    // function cash() external returns (bool);
}