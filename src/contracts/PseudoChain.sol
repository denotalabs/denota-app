// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;
import "../contracts/CheqRegistrar.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";
import "./ICheqModule.sol";

contract PseudoChain is ICheqModule, Ownable {  
    CheqRegistrar public cheq;
    mapping(uint256 => uint256) public blockCashTime;


    constructor(CheqRegistrar _cheq){
        cheq = _cheq;
        blockCashTime[0] = block.timestamp;
    }
    function isWriteable(address, IERC20, uint256, uint256, address, address) public pure returns(bool) { 
        return true;
    }

    function writeCheq(IERC20 _token, uint256 amount, uint256, address) public returns(uint256){
        // require(blockCashTime[]);
        uint256 cheqId = cheq.write(_msgSender(), address(this), _token, amount, amount, address(this));
        blockCashTime[cheqId] = blockCashTime[cheqId-1] + 1 days;
        return cheqId;
    }

    function isTransferable(uint256 /* cheqId */, address /* caller */, address /* to */) public pure returns(bool){
        return false;
    }

    function transferCheq(uint256 cheqId, address to) public {
        require(isTransferable(cheqId, _msgSender(), to), "Not owner");
        cheq.transferFrom(_msgSender(), to, cheqId);
    }

    function fundable(uint256 /* cheqId */, address, uint256) public pure returns(uint256) {
        return 0;
    }

    function fundCheq(uint256 cheqId, uint256 amount) public {  
        uint256 fundableAmount = fundable(cheqId, _msgSender(), amount);
        require(fundableAmount == amount, "Cant fund this amount");
        cheq.fund(cheqId, _msgSender(), amount);
    }

    function cashable(uint256 cheqId, address /* caller */, uint256 /* blockHash */) public view returns(uint256) {
        if (false) { // "0"*n+"..." == keccack((keccack(cheqId) + hash)
            return cheq.cheqEscrowed(cheqId);
        } else {
            return 0;
        }
    }

    function cashCheq(uint256 cheqId, uint256 amount) public {
        uint256 cashableAmount = cashable(cheqId, _msgSender(), amount);
        require(cashableAmount == amount, "Cant cash this amount");
        cheq.cash(cheqId, _msgSender(), amount);
    }
    function tokenURI(uint256 tokenId) external pure returns (string memory){
        return string(abi.encodePacked("", tokenId));
    }
    function isApprovable(uint256 /*cheqId*/, address /*caller*/, address /*to*/) external pure returns(bool){
        return true;
    }
}