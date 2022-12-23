// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

interface ICheqModule {
    /// Writing a cheq usually contains more or different variables that can't be uniformly standardized. 
    /// Perhaps create some supportsInterfaces for different kinds of basic contracts (BYOA, TIMELOCK, etc)
    //// function isWriteable(address sender, IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) external view returns(bool);
    //// function writeCheq(IERC20 _token, uint256 amount, uint256 escrowed, address recipient, address owner) external returns(uint256);
    // Checks isWritable()
    // Calls CheqRegistrar.write() -> cheqId
    // Updates the broker contract's variables
    
    // Checks if `caller` is allowed to transfer `cheqId` to `to`
    // Checks if caller has this privilege
    function isTransferable(uint256 cheqId, address caller, address to) external view returns(bool);
    function transferCheq(uint256 cheqId, address to) external; // TODO: would any case need a _before and _after hook??
    function _beforeTransfer(uint256 cheqId, address from, address to) external;
    function _afterTransfer(uint256 cheqId, address from, address to) external;  // Is `from` and `to` necessary?

    // Updates approval related variables, how to update these after a transfer??
    function approveCheq(uint256 cheqId, address to) external returns(bool); // onlyRegistrar

    function fundable(uint256 cheqId, address caller, uint256 amount) external view returns(uint256);
    function fundCheq(uint256 cheqId, uint256 amount) external;
    
    function cashable(uint256 cheqId, address caller, uint256 amount) external view returns(uint256);  // How much can be cashed
    function cashCheq(uint256 cheqId, uint256 amount) external;
    function tokenURI(uint256 tokenId) external view returns (string memory);

    // OPTIONAL and kept for backwards compatibility with NFT marketplaces. 
    // Allows transfers that originate from the CheqRegistrar
    // CheqRegistrar: approve(){
                        // ICheqModule.isApprovable(); 
                        // _approve(); 
                        // ICheqModule.approveCheq()}
    // Returning `true` opts the module into transfers originating from CheqRegistrar by approved parties 
    function isApproved(uint256 cheqId, address spender) external view returns(bool);
    function getApproved(uint256 cheqId) external view returns (address);

}

// isApproved() just checks isTransferable()
// getApproved() asks who is allowed to transfer, what if more than one?
// getApproved() requires only one person has approval BUT 
// isApprovedForAll() returns if the address itself is an operator
// how to keep them distinct?

/**
// SHOULD NOT BE CALLED FROM REGISTRAR?
function approve(address to, uint256 tokenId) public virtual override {
    module.approve();
}
function getApproved(uint256 tokenId) public view virtual override returns (address) {
function setApprovalForAll(address operator, bool approved) public virtual override {
function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {

PROBLEM:
cheqs need to be transfered with calls originating from the registrar and from the module
... But why the module? Who will do that? Maybe cheaper, since hooks need to be updated... But what does ownership mean then??

transfers only delegate from registrar
registrar will say whether they can transfer

 */