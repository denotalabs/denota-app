// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;
import "../contracts/CheqRegistrar.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";
import "./ICheqModule.sol";

contract SimpleBank is ICheqModule, Ownable {  
    CheqRegistrar public cheq;
    mapping(uint256 => uint256) public cheqCreated;
    mapping(uint256 => bool) public cheqIsPaused;
    mapping(address => bool) public userWhitelist;
    mapping(IERC20 => bool) public tokenWhitelist;
    uint256 public settlementPeriod;
    string private _baseURI;

    constructor(CheqRegistrar _cheq, uint256 settlementTime){
        cheq = _cheq;
        settlementPeriod = settlementTime;
    }

    function whitelistUser(address user, bool isAccepted) public onlyOwner {
        userWhitelist[user] = isAccepted;
    }
    function whitelistToken(IERC20 token, bool isAccepted) public onlyOwner {
        tokenWhitelist[token] = isAccepted;
    }
    function pauseCheq(uint256 cheqId, bool isPaused) public onlyOwner {
        cheqIsPaused[cheqId] = isPaused;
    }

    function isWriteable(address sender, IERC20 token, uint256 amount, uint256 escrowed, address recipient, address owner) public view returns(bool) { 
        return tokenWhitelist[token] && userWhitelist[sender] && userWhitelist[recipient] && amount == escrowed && owner == recipient && amount > 0;
    }

    function writeCheq(
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address recipient
        ) public returns(uint256){
        require(isWriteable(_msgSender(), _token, amount, escrow, recipient, recipient), "Not Writable");
        uint256 cheqId = cheq.write(_msgSender(), recipient, _token, amount, escrow, recipient);
        cheqCreated[cheqId] = block.timestamp;
        return cheqId;
    }

    function isTransferable(uint256, address, address) public pure returns(bool){
        return false;
    }

    function transferCheq(uint256, address) public pure {
        require(false, "Cant transfer");
    }

    function fundable(uint256, address, uint256) public pure returns(uint256) {
        return 0;
    }
    function fundCheq(uint256, uint256) public pure {
        require(false, "Cant fund");
    }

    function cashable(uint256 cheqId, address caller, uint256) public view returns(uint256) { 
        if (cheq.ownerOf(cheqId)==caller && cheqCreated[cheqId]+settlementPeriod > block.timestamp && !cheqIsPaused[cheqId]) {
            return cheq.cheqEscrowed(cheqId);
        } else {
            return 0;
        }
    }

    function cashCheq(uint256 cheqId, uint256 amount) external {
        uint256 cashableAmount = cashable(cheqId, _msgSender(), amount);
        require(cashableAmount > 0, "Not cashable");
        require(cashableAmount == amount, "Cant cash this amount");
        cheq.cash(cheqId, _msgSender(), amount);
    }
    function tokenURI(uint256 tokenId) external view returns (string memory){
        return string(abi.encodePacked(_baseURI, tokenId));
    }

    function isApprovable(uint256 tokenId, address caller, address /* to */) public view returns(bool){
        return cheq.ownerOf(tokenId) == caller;
    }

    function approveCheq(address to, uint256 cheqId) public {
        require(isApprovable(cheqId, _msgSender(), to), "");
        cheq.approve(to, cheqId);
    }
}

