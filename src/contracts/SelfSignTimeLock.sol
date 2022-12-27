// SPDX-License-Identifier: BUSL-1.1
pragma solidity >=0.8.14;

import { CheqRegistrar } from "./CheqRegistrar.sol";
import "./ICheqModule.sol";
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";

contract SelfSignTimeLock is ICheqModule, Ownable, ERC721 {  
    CheqRegistrar public cheq;
    mapping(uint256 => address) public cheqFunder;
    mapping(uint256 => address) public cheqReceiver;
    mapping(uint256 => uint256) public cheqCreated;
    mapping(uint256 => uint256) public cheqInspectionPeriod;
    mapping(uint256 => bool) public isEarlyReleased;  // TODO: add early release
    mapping(IERC20 => bool) public tokenWhitelist;
    string private baseURI;

    function whitelistToken(IERC20 token, bool isAccepted) public onlyOwner {
        tokenWhitelist[token] = isAccepted;
    }
    constructor(CheqRegistrar _cheq) ERC721("", ""){
        cheq = _cheq;
    }

    function isWriteable(address, IERC20, uint256, uint256, address, address) public pure returns(bool) { 
        return true;
    }
    function writeCheq(   // Integer overflows if block.timestamp+inspectionPeriod too large, solidity 0.8 reverts
        IERC20 _token,
        uint256 amount,
        uint256 escrow,
        address recipient,
        uint256 inspectionPeriod
        ) public returns(uint256){  // If no escrow its an invoice

        require(recipient != _msgSender(), "Can't self send");
        require(amount > 0, "Can't send cheq with 0 value");
        if (escrow == 0){  // Invoice
            uint256 cheqId = cheq.write(_msgSender(), recipient, _token, amount, escrow, _msgSender());  // Sender is owner
            cheqCreated[cheqId] = block.timestamp;
            cheqInspectionPeriod[cheqId] = inspectionPeriod;
            cheqFunder[cheqId] = recipient;
            cheqReceiver[cheqId] = _msgSender();
            return cheqId;
        } else {  // Cheq
            if (cheq.deposits(_msgSender(), _token) < escrow){
                uint256 shortfall = escrow - cheq.deposits(_msgSender(), _token);
                require(cheq.deposit(_token, _msgSender(), shortfall), "Deposit failed");
            }
            // require(cheq.deposits(_msgSender(), _token) + _token.balanceOf(_msgSender()) >= amount, "Must have reserves to send partial");
            uint256 cheqId = cheq.write(_msgSender(), recipient, _token, amount, escrow, recipient);
            cheqCreated[cheqId] = block.timestamp;
            cheqInspectionPeriod[cheqId] = inspectionPeriod;
            cheqFunder[cheqId] = _msgSender();
            cheqReceiver[cheqId] = recipient;
            return cheqId;
        }
    }

    function isTransferable(uint256 cheqId, address caller, address /* to */) public view returns(bool){
        return cheq.ownerOf(cheqId)==caller;  // Would caller ever be addres(0)
    }
    function transferCheq(uint256 cheqId, address to) public {
        require(isTransferable(cheqId, _msgSender(), to), "Not owner");
        cheq.transferFrom(_msgSender(), to, cheqId);
    }

    function fundable(uint256 cheqId, address, uint256) public view returns(uint256) {
        if (cheq.cheqEscrowed(cheqId) == 0) {  // Invoice  // && caller == cheqReciever[cheqId]
            return cheq.cheqAmount(cheqId);
        } else {  // Cheq
            return 0;
        }
    }
    function fundCheq(uint256 cheqId, uint256 amount) public {  
        uint256 fundableAmount = fundable(cheqId, _msgSender(), amount);
        // require(fundableAmount > 0, "Not fundable");  // Are 
        require(fundableAmount == amount, "Cant fund this amount");
        IERC20 _token = cheq.cheqToken(cheqId);
        if (cheq.deposits(_msgSender(), _token) < amount){
            uint256 shortfall = amount - cheq.deposits(_msgSender(), _token);
            require(cheq.deposit(_token, _msgSender(), shortfall), "Deposit failed");
        }
        cheq.fund(cheqId, _msgSender(), amount);
        cheqCreated[cheqId] = block.timestamp;  // BUG: can update with 0 at any time- If it can be funded its an invoice, reset creation date for job start
    }

    // BUG what if funder doesnt fund the invoice for too long??
    function cashable(uint256 cheqId, address caller, uint256 /* amount */) public view returns(uint256) {  // Invoice funder can cash before period, cheq writer can cash before period
        // Chargeback case
        if (cheqFunder[cheqId] == caller && (block.timestamp < cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])){  // Funding party can rescind before the inspection period elapses
            return cheq.cheqEscrowed(cheqId);
        } else if (cheq.ownerOf(cheqId) == caller && (block.timestamp >= cheqCreated[cheqId] + cheqInspectionPeriod[cheqId])){  // Receiving/Owning party can cash after inspection period
            return cheq.cheqEscrowed(cheqId);
        } else if (isEarlyReleased[cheqId]){
            return cheq.cheqEscrowed(cheqId);
        } else {
            return 0;
        }
    }
    function cashCheq(uint256 cheqId, uint256 amount) public {  // TODO: allow anyone to cash for someone?
        uint256 cashableAmount = cashable(cheqId, _msgSender(), amount);
        require(cashableAmount == amount, "Cant cash this amount");
        cheq.cash(cheqId, _msgSender(), amount);
    }
    function cashCheq(uint256 cheqId) public {
        uint256 cashableAmount = cashable(cheqId, _msgSender(), 0);
        cashCheq(cheqId, cashableAmount);
    }
    function isApprovable(uint256 cheqId, address caller, address /* to */) public view returns(bool){
        return cheq.ownerOf(cheqId) == caller;  // 
    }
    function getApproved(uint256 cheqId) public view override(ERC721, ICheqModule) returns (address){
        return address(0);
    }
    function approveCheq(uint256 cheqId, address to) public returns (bool) {
        require(isApprovable(cheqId, _msgSender(), to), "");
        return true;
    }
    function tokenURI(uint256 tokenId) public view override(ERC721, ICheqModule) returns (string memory){
        return string(abi.encodePacked(baseURI, tokenId));
    }
    function setBaseURI(string calldata _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function earlyRelease(uint256 cheqId, bool isReleased) public {
        require(cheqFunder[cheqId]==_msgSender(), "only funder can release early");
        isEarlyReleased[cheqId] = isReleased;
    }
    // function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    //     _exists(tokenId);

    //     // string memory _tokenURI = _tokenURIs[tokenId];
    //     string memory base = _baseURI();

    //     // If there is no base URI, return the token URI.
    //     if (bytes(base).length == 0) {
    //         return string(tokenId);
    //     }
    //     // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
    //     if (bytes(_tokenURI).length > 0) {
    //         return string(abi.encodePacked(base, _tokenURI));
    //     }

    //     return super.tokenURI(tokenId);
    // }

    // function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
    //     require(_exists(tokenId), "ERC721URIStorage: URI set of nonexistent token");
    //     _tokenURIs[tokenId] = _tokenURI;
    // }
}
