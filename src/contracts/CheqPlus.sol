// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;
import "src/contracts/Cheq.sol";
import "openzeppelin/token/ERC20/IERC20.sol";


contract CheqAuditorPayments{
    Cheq public cheq;
    mapping(address => bool) public acceptOnPayment; // Will auditor accept user upon payment?
    mapping(address => mapping(address => bool)) public acceptUserOnPayment; // Will auditor accept user upon payment?
    
    mapping(address => uint256) public maxCheqs; // Number of cheqs one auditor is willing to audit
    mapping(address => uint256) public currentCheqs; // Number of cheqs an auditor is currently reviewing
    
    mapping(address => bool) public isPayable; // Whether auditor is ready to accept payment
    mapping(address => mapping(IERC20 => uint256)) public cheqPrice; // Price for one cheq
    mapping(address => uint256) public cheqCap; // Most number of cheqs a user can purchase
    
    mapping(address => mapping(address => uint256)) public cheqBook; // Number of Cheqs the user can write using their auditor

    constructor(Cheq _cheq){
        cheq = _cheq;
    }

    /* 
    1. User requests auditor
    2. User pays auditor
    3. User receives cheqBook */
    function payAuditor(IERC20 token, uint256 _amount, address auditor) public { 
        // Must check if user has too many cheqs, if auditor is at max auditing capacity, is accepting payments
        require(cheqBook[auditor][msg.sender]+_amount<=cheqCap[auditor], "Purchasing More Than Limit");
        if (!cheq.userAuditor(msg.sender, auditor)){ // User doesn't accept auditor yet
            cheq.acceptAuditor(auditor, true);  // Needs to do so on behalf of user
        }

        if (isPayable[auditor] && currentCheqs[auditor]+_amount<=maxCheqs[auditor]){
            require(cheqPrice[auditor][token]!=0, "Auditor Hasn't Set Price");
            uint256 price = cheqPrice[auditor][token] * _amount;
            token.transferFrom(msg.sender, auditor, price);
            if (acceptOnPayment[auditor] || acceptUserOnPayment[auditor][msg.sender]){  // Auditor accepts everyone on payment or specifically this user
                cheq.acceptUser(msg.sender, true);  // Needs to do so on behalf of auditor
                setUserCheqs(msg.sender, _amount);
            } // Auditor would need to honor user's payment in this case
        }
    }

    function setUserCheqs(address user, uint256 _amount) public {
        cheqBook[msg.sender][user] = _amount;
    }
}


contract CheqPool {  // Automated Market Maker
    Cheq public cheq;
    uint256 public balance;
    mapping(address=>uint256) public liquidityTokens;  // Liquidity Tokens

    constructor(Cheq _cheq){
        cheq = _cheq;
    }
    function deposit(uint256 tokenId) public {
        cheq.approve(address(this), tokenId);  // Need user to give approval, not contract
        cheq.transferFrom(msg.sender, address(this), tokenId);
        uint256 amount = cheq.chequeAmount(tokenId);
        balance += amount;
        liquidityTokens[msg.sender] += amount;
    }

}

contract CheqMarket {  // Secondary Market
    Cheq public cheq;
    mapping(address=>bool) public whitelist;
    mapping(address=>bool) public blacklist;

    constructor(Cheq _cheq){
        cheq = _cheq;
    }

    function deployPool() public returns (CheqPool){
        CheqPool pool = new CheqPool(cheq);
        return pool;
    }
    function _swap(address to, uint256 tokenId) private {
        cheq.approve(to, tokenId);  // Approve the marketplace to swap
    }
    function whitelistSwap(address to, uint256 tokenId) public{
        require(whitelist[msg.sender], "Not Whitelisted");
         _swap(to, tokenId);
    }
    function sanctionedSwap(address to, uint256 tokenId) public{
        require(!blacklist[msg.sender], "Is Blacklisted");
         _swap(to, tokenId);
    }
    function openSwap(address to, uint256 tokenId) public{
        _swap(to, tokenId);
    }
    // Swaps, white/blacklists, tranch pool deployment, 
}
