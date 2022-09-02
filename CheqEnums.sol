// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;
import "openzeppelin/token/ERC721/ERC721.sol";
import "openzeppelin/token/ERC20/IERC20.sol";
import "openzeppelin/access/Ownable.sol";
import "src/contracts/Cheq.sol";

contract CheQ is ERC721, Ownable {
    enum Transferring {Allowed, Whitelist, Disallowed}
    enum Status {Pending, Voided, Cashed}
    struct Cheque{
        uint256 amount;
        uint256 created;
        uint256 expiry;
        IERC20 token;
        address drawer;
        address recipient;
        address auditor;
        Transferring transferring;
        Status status;
        bool collateralized;
    }
    mapping(uint256=>Cheque) public chequeInfo;  // Cheque information
    mapping(address=>mapping(IERC20=>uint256)) public deposits;  // Total user deposits
    mapping(uint256=>mapping(address=>bool)) public chequeWhitelist;  // Cheque struct could have transfer conditions
    uint256 private totalSupply;  // Total cheques created
    constructor() ERC721("dCheque", "dCHQ"){
    }

    function writeCheque(IERC20 _token, uint256 amount, uint256 duration, address auditor, address recipient, 
        Transferring _transferring, Status _status, bool _collateralized) 
        external returns(uint256){ // UserAuditorUserHandshake(_token, amount, auditor, duration, recipient)
        require(deposits[_msgSender()][_token]>=amount, "Insufficient balance");
        deposits[_msgSender()][_token] -= amount;
        _safeMint(recipient, totalSupply);
        chequeInfo[totalSupply] = Cheque({drawer:_msgSender(), recipient:recipient, created:block.timestamp, expiry:block.timestamp+duration, 
                                       auditor:auditor, token:_token, amount:amount, transferring:_transferring, status:_status, collateralized:_collateralized});
        totalSupply += 1;
        return totalSupply-1;  // NOT IDEAL
    }
    function transferFrom(address from, address to, uint256 chequeID) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), chequeID), "Transfer disallowed");
        // require(!chequeInfo[chequeID].transferring()==0, "Transfer disallowed");
        // _feeOnTransfer(chequeID);
        _transfer(from, to, chequeID);
    }

    function safeTransferFrom(address from, address to, uint256 chequeID, bytes memory data) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), chequeID), "Transfer disallowed");
        // _feeOnTransfer(chequeID);
        _safeTransfer(from, to, chequeID, data);
    }

}