// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract dCheque is ERC721, Ownable {
    struct Cheque{
        uint256 amount;
        uint256 created;
        uint256 expiry;
        IERC20 token;
        address drawer;
        address recipient;
        address auditor;
        string memo;  // Possible attack vector?
    }

    mapping(address=>mapping(address=>bool)) public userAuditor;  // Whether User accepts Auditor
    mapping(address=>address[]) public acceptedUserAuditors;  // Auditor addresses that user accepts
    mapping(address=>mapping(address=>bool)) public auditorUser;  // Whether Auditor accepts User
    mapping(address=>address[]) public acceptedAuditorUsers;  // User addresses that auditor accepts
    mapping(address=>mapping(uint256=>bool)) public auditorDurations;  // Auditor voiding periods

    mapping(address=>address) public trustedAccount;  // User's trusted account
    mapping(address=>uint256) public lastTrustedChange;
    uint256 public trustedAccountCooldown;

    mapping(uint256=>Cheque) public chequeData;
    mapping(address=>mapping(IERC20=>uint256)) public deposits;  // Total user deposits
    uint256 private totalSupply;  // Total cheques created

    mapping(IERC20=>uint256) public protocolFee;
    mapping(IERC20=>uint256) public protocolReserve;

    event Deposit(IERC20 _token, address indexed from, uint256 amount);
    event Cash(address indexed bearer, uint256 indexed chequeID);
    event Void(address indexed drawer, address indexed auditor, uint256 indexed chequeID);
    
    event AcceptAuditor(address indexed user, address indexed auditor);
    event AcceptUser(address indexed auditor, address indexed user);
    
    event SetProtocolFee(IERC20 _token, uint256 amount);
    event Withdraw(address indexed _address, uint256 amount);

    modifier UserAuditorUserHandshake(IERC20 _token, uint256 amount, address auditor, uint256 duration, address recipient){
        require(deposits[_msgSender()][_token]>=amount, "Writing more than available");
        require(userAuditor[_msgSender()][auditor], "You must approve this auditor");
        require(auditorUser[auditor][_msgSender()],  "Auditor must approve you");
        require(auditorUser[auditor][recipient],  "Auditor must approve this recipient");
        require(userAuditor[recipient][auditor], "Recipient must approve this auditor");
        require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        _;
    }

    constructor(uint256 _trustedAccountCooldown){
        trustedAccountCooldown = _trustedAccountCooldown;
    }
    function setProtocolFee(IERC20 _token, uint256 _protocolFee) external onlyOwner{  
        protocolFee[_token] = _protocolFee;
        emit SetProtocolFee(_token, _protocolFee);
    }

    function _deposit(IERC20 _token, address _address, uint256 _amount) private {
        bool success = _token.transferFrom(_msgSender(), address(this), _amount); 
        require(success, "Token transfer failed");
        deposits[_address][_token] += _amount;
        emit Deposit(_token, _address, _amount);
    }
    function deposit(IERC20 _token, uint256 _amount) external returns (bool){
        _deposit(_token, _msgSender(), _amount);
        return true;
    }
    function deposit(IERC20 _token, uint256 _amount, address _address) external returns (bool){
        _deposit(_token, _address, _amount);
        return true;
    }

    // Inherited function use //
    function writeCheque(
        IERC20 _token, 
        uint256 amount, 
        uint256 duration, 
        address auditor, 
        address recipient, string calldata _memo) 
        external UserAuditorUserHandshake(_token, amount, auditor, duration, recipient) {
        deposits[_msgSender()][_token] -= amount;
        _safeMint(_msgSender(), totalSupply);  // chequeCount[recipient]+=1;
        chequeData[totalSupply] = Cheque({drawer:_msgSender(), recipient:recipient, created:block.timestamp, expiry:block.timestamp+duration, 
                                       auditor:auditor, token:_token, amount:amount, memo:_memo});
        totalSupply += 1;
    }
    function cashCheque(uint256 chequeID) external {  // Only allow withdraws via cheque writing
        Cheque storage cheque = chequeData[chequeID];
        require(_isApprovedOrOwner(_msgSender(), chequeID), "Must own cheque to cash");
        require(cheque.expiry>block.timestamp, "Cheque not cashable yet");
        bool success = cheque.token.transferFrom(address(this), _msgSender(), cheque.amount);
        require(success, "Transfer failed.");
        _burn(chequeID); 
        emit Cash(_msgSender(), chequeID);
    }
    function voidCheque(uint256 chequeID) external {
        Cheque memory cheque = chequeData[chequeID];
        require(cheque.auditor==_msgSender(), "Must be auditor");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        _burn(chequeID); 
        deposits[cheque.drawer][cheque.token] += cheque.amount;  // Add balance back to signer
        emit Void(cheque.drawer, cheque.auditor, chequeID);
    }
    function voidRescueCheque(uint256 chequeID) external {  // Reentrency?
        Cheque memory cheque = chequeData[chequeID];
        require(cheque.auditor==_msgSender(), "Must be auditor");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        _burn(chequeID);
        address fallbackAccount = trustedAccount[cheque.drawer];
        deposits[fallbackAccount][cheque.token] += cheque.amount;  // Add cheque amount to trusted account deposit balance
        emit Void(cheque.drawer, cheque.auditor, chequeID);
    }
    function transfer(address to, uint256 chequeID) external {
        safeTransferFrom(_msgSender(), to, chequeID);
        Cheque storage cheque = chequeData[chequeID];
        IERC20 _token = cheque.token;
        cheque.amount -= protocolFee[_token];
        protocolReserve[_token] += protocolFee[_token];
    }
    function directTransfer(IERC20 _token, address _to, uint256 _amount) external{
        require(deposits[_msgSender()][_token]>=_amount, "Cannot send more than available");
        deposits[_msgSender()][_token] -= _amount;
        deposits[_to][_token] += _amount;
    }

    function withdraw(IERC20 _token, uint256 _amount) external onlyOwner{
        require(protocolReserve[_token]>=_amount, "Can't withdraw more than available");
        protocolReserve[_token]-= _amount;
        bool success = _token.transferFrom(address(this), _msgSender(), _amount);
        require(success, "Transfer failed.");
        emit Withdraw(_msgSender(), _amount);
    }
    function acceptAuditor(address auditor) public returns (bool){  // User will set this 
        if (userAuditor[_msgSender()][auditor]){
            return true;
        }
        userAuditor[_msgSender()][auditor] = true;
        if (auditorUser[auditor][_msgSender()]){
            acceptedAuditorUsers[auditor].push(_msgSender());
            acceptedUserAuditors[_msgSender()].push(auditor);
        }
        emit AcceptAuditor(_msgSender(), auditor);
        return true;
    }
    function acceptUser(address drawer) public returns (bool){  // Auditor will set this 
        if (auditorUser[_msgSender()][drawer]){
            return true;
        }
        auditorUser[_msgSender()][drawer] = true;
        if (userAuditor[drawer][_msgSender()]){
            acceptedUserAuditors[drawer].push(_msgSender());
            acceptedAuditorUsers[_msgSender()].push(drawer);
        }
        emit AcceptUser(_msgSender(), drawer);
        return true;
    }
    function setAllowedDuration(uint256 duration) external {  // Auditor will set this
        auditorDurations[_msgSender()][duration] = true;
    }
    function setTrustedAccount(address account) external {  // User will set this
        require((lastTrustedChange[_msgSender()] + trustedAccountCooldown)<block.timestamp, "Can only change trusted account once every 180 days");
        trustedAccount[_msgSender()] = account;
        lastTrustedChange[_msgSender()] = block.timestamp;
    }
    function chequeDrawer(uint256 chequeId) external view returns (address) {
        return chequeData[chequeId].drawer;
    }
    function chequeRecipient(uint256 chequeId) external view returns (address) {
        return chequeData[chequeId].recipient;
    }
    function chequeAuditor(uint256 chequeId) external view returns (address) {
        return chequeData[chequeId].auditor;
    } 
    function chequeAmount(uint256 chequeId) external view returns (uint256) {
        return chequeData[chequeId].amount;
    }
    function chequeExpiry(uint256 chequeId) external view returns (uint256) {
        return chequeData[chequeId].expiry;
    }
    function chequeCreated(uint256 chequeId) external view returns (uint256) {
        return chequeData[chequeId].created;
    }
    function getAcceptedUserAuditors(address _address) external view returns (address[] memory){
        return acceptedUserAuditors[_address];
    }
    function getAcceptedAuditorUsers(address _address) external view returns (address[] memory){
        return acceptedAuditorUsers[_address];
    }
}