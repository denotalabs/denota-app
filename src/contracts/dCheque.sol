// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// address public immutable POLYGON_WETH_ADDRESS = '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619';
// address public immutable POLYGON_USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

contract dCheque{
    struct Cheque{
        uint256 amount;
        uint256 created;
        uint256 expiry;
        IERC20 token;
        address drawer;
        address recipient;
        address bearer;
        address auditor;
        bool voided;
        bool transferable;
        string memo;  // Possible attack vector?
    }
    mapping(address=>mapping(address=>bool)) public userAuditor;  // Whether User accepts Auditor
    mapping(address=>address[]) public acceptedUserAuditors;  // Auditor addresses that user accepts
    mapping(address=>mapping(address=>bool)) public auditorUser;  // Whether Auditor accepts User
    mapping(address=>address[]) public acceptedAuditorUsers;  // User addresses that auditor accepts
    mapping(address=>mapping(uint256=>bool)) public auditorDurations;  // Auditor voiding periods

    mapping(address=>address) public trustedAccount;  // User's trusted account
    mapping(address=>uint256) public lastTrustedChange;
    uint256 public trustedAccountCooldown = 180 days;

    mapping(uint256=>Cheque) public cheques;
    mapping(address=>uint256) public chequeCount;  // User's balance of cheques
    mapping(address=>mapping(IERC20=>uint256)) public deposits;  // Total user deposits
    uint256 public totalSupply;  // Total cheques created

    mapping(IERC20=>uint256) public protocolFee;
    mapping(IERC20=>uint256) public protocolReserve;

    event Deposit(IERC20 _token, address indexed from, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 indexed chequeID);
    event Withdraw(address indexed _address, uint256 amount);
    event Cash(address indexed bearer, uint256 indexed chequeID);
    event Void(address indexed drawer, address indexed auditor, uint256 indexed chequeID);
    event AcceptAuditor(address indexed user, address indexed auditor);
    event AcceptUser(address indexed auditor, address indexed user);
    event SetProtocolFee(IERC20 _token, uint256 amount);

    function _deposit(IERC20 _token, address _address, uint256 _amount) private {
        bool success = _token.transferFrom(msg.sender, address(this), _amount);
        require(success, "Token transfer failed");
        deposits[_address][_token] += _amount;
        emit Deposit(_token, _address, _amount);
    }
    function deposit(IERC20 _token, uint256 _amount) external returns (bool){
        _deposit(_token, msg.sender, _amount);
        return true;
    }
    function deposit(IERC20 _token, uint256 _amount, address _address) external returns (bool){
        _deposit(_token, _address, _amount);
        return true;
    }
    function setProtocolFee(IERC20 _token, uint256 _protocolFee) external {
        protocolFee[_token] = _protocolFee;
        emit SetProtocolFee(_token, _protocolFee);
    }
    function writeCheque(IERC20 _token, uint256 amount, uint256 duration, address auditor, string calldata _memo) public {
        require(deposits[msg.sender][_token]>=amount, "Writing more than available");
        require(userAuditor[msg.sender][auditor], "User must approve this auditor");
        require(auditorUser[auditor][msg.sender],  "Auditor must approve this account");
        require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        deposits[msg.sender][_token] -= amount;
        totalSupply += 1;
        chequeCount[msg.sender]+=1;
        cheques[totalSupply] = Cheque({drawer:msg.sender, recipient:msg.sender, bearer:msg.sender, created:block.timestamp, expiry:block.timestamp+duration, 
                                       auditor:auditor, token:_token, amount:amount, voided:false, transferable:true, memo:_memo});
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    function addPayRecipient(address auditor, address recipient, uint256 chequeID) external{
        Cheque storage cheque = cheques[chequeID];
        require((cheque.drawer==msg.sender)&&(cheque.bearer==msg.sender), "Must be drawer and owner to change recipient");
        require(auditorUser[auditor][recipient],  "Auditor must approve this recipient");
        require(userAuditor[recipient][auditor], "Recipient must approve this auditor");
        cheque.recipient = recipient;
        transfer(recipient, chequeID);
    }
    function writeCheque(IERC20 _token, uint256 amount, uint256 duration, address auditor, address recipient, string calldata _memo) public {
        require(deposits[msg.sender][_token]>=amount, "Writing more than available");
        require(userAuditor[msg.sender][auditor], "You must approve this auditor");
        require(userAuditor[recipient][auditor], "Recipient must approve this auditor");
        require(auditorUser[auditor][msg.sender],  "Auditor must approve you");
        require(auditorUser[auditor][recipient],  "Auditor must approve this recipient");
        require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        deposits[msg.sender][_token] -= amount;
        totalSupply += 1;
        chequeCount[recipient]+=1;
        cheques[totalSupply] = Cheque({drawer:msg.sender, recipient:recipient, bearer:recipient, created:block.timestamp, expiry:block.timestamp+duration, 
                                       auditor:auditor, token:_token, amount:amount, voided:false, transferable:true, memo:_memo});
        emit Transfer(msg.sender, recipient, totalSupply);
    }
    function cashCheque(uint256 chequeID) external {  // Only allow withdraws via cheque writing
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Must own cheque to cash");
        require(cheque.expiry>block.timestamp, "Cheque not cashable yet");
        require(!cheque.voided, "Cheque voided");
        cheque.voided = true;
        // (bool success, ) = msg.sender.call{value:cheque.amount}("");
        bool success = cheque.token.transferFrom(address(this), msg.sender, cheque.amount);
        require(success, "Transfer failed.");
        chequeCount[cheque.bearer]-=1;
        emit Cash(cheque.bearer, chequeID);
    }
    function voidCheque(uint256 chequeID) external {
        Cheque storage cheque = cheques[chequeID];
        require(cheque.auditor==msg.sender, "Must be auditor");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        cheque.voided = true;
        cheque.transferable = false;
        chequeCount[cheque.bearer]-=1;
        deposits[cheque.drawer][cheque.token] += cheque.amount;  // Add balance back to signer
        emit Void(cheque.drawer, cheque.auditor, chequeID);
    }
    function voidRescueCheque(uint256 chequeID) external {  // Reentrency?
        Cheque storage cheque = cheques[chequeID];
        require(cheque.auditor==msg.sender, "Must be auditor");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        cheque.voided = true;
        cheque.transferable = false;
        chequeCount[cheque.bearer]-=1;
        address fallbackAccount = trustedAccount[cheque.drawer];
        deposits[fallbackAccount][cheque.token] += cheque.amount;  // Add cheque amount to trusted account deposit balance
        emit Void(cheque.drawer, cheque.auditor, chequeID);
        emit Transfer(cheque.bearer, fallbackAccount, chequeID);
    }
    function directTransfer(IERC20 _token, address _to, uint256 _amount) external{
        deposits[msg.sender][_token] -= _amount;
        deposits[_to][_token] += _amount;
    }
    function transfer(address to, uint256 chequeID) public {
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Only cheque owner can transfer");
        require(cheque.transferable, "Cheque not transferable");
        IERC20 _token = cheque.token;
        cheque.amount -= protocolFee[_token];
        protocolReserve[_token] += protocolFee[_token];
        cheque.bearer = to;
        emit Transfer(msg.sender, to, chequeID);
    }
    function withdraw(IERC20 _token, uint256 _amount) external{ // PROTOCOL FEES (ONLY OWNER)
        require(protocolReserve[_token]>=_amount, "Can't withdraw more than available");
        protocolReserve[_token]-= _amount;
        bool success = _token.transferFrom(address(this), msg.sender, _amount);
        require(success, "Transfer failed.");
        emit Withdraw(msg.sender, _amount);
    }

    function acceptAuditor(address auditor) public returns (bool){  // User will set this 
        if (userAuditor[msg.sender][auditor]){
            return true;
        }
        userAuditor[msg.sender][auditor] = true;
        if (auditorUser[auditor][msg.sender]){
            acceptedAuditorUsers[auditor].push(msg.sender);
            acceptedUserAuditors[msg.sender].push(auditor);
        }
        emit AcceptAuditor(msg.sender, auditor);
        return true;
    }
    function acceptUser(address drawer) public returns (bool){  // Auditor will set this 
        if (auditorUser[msg.sender][drawer]){
            return true;
        }
        auditorUser[msg.sender][drawer] = true;
        if (userAuditor[drawer][msg.sender]){
            acceptedUserAuditors[drawer].push(msg.sender);
            acceptedAuditorUsers[msg.sender].push(drawer);
        }
        emit AcceptUser(msg.sender, drawer);
        return true;
    }
    function setAllowedDuration(uint256 duration) external {  // Auditor will set this
        auditorDurations[msg.sender][duration] = true;
    }
    function setTrustedAccount(address account) external {  // User will set this
        require((lastTrustedChange[msg.sender] + trustedAccountCooldown)<block.timestamp, "Can only change trusted account once every 180 days");
        trustedAccount[msg.sender] = account;
        lastTrustedChange[msg.sender] = block.timestamp;
    }

    function chequeDrawer(uint256 chequeId) external view returns (address) {
        return cheques[chequeId].drawer;
    }
    function chequeRecipient(uint256 chequeId) external view returns (address) {
        return cheques[chequeId].recipient;
    }
    function ownerOf(uint256 chequeId) external view returns(address) {
        return cheques[chequeId].bearer;
    }
    function chequeAuditor(uint256 chequeId) external view returns (address) {
        return cheques[chequeId].auditor;
    } 
    function chequeAmount(uint256 chequeId) external view returns (uint256) {
        return cheques[chequeId].amount;
    }
    function chequeExpiry(uint256 chequeId) external view returns (uint256) {
        return cheques[chequeId].expiry;
    }
    function chequeVoided(uint256 chequeId) external view returns (bool) {
        return cheques[chequeId].voided;
    }
    function chequeTransferable(uint256 chequeId) external view returns (bool) {
        return cheques[chequeId].transferable;
    }
    function chequeCreated(uint256 chequeId) external view returns (uint256) {
        return cheques[chequeId].created;
    }
    function getAcceptedUserAuditors(address _address) external view returns (address[] memory){
        return acceptedUserAuditors[_address];
    }
    function getAcceptedAuditorUsers(address _address) external view returns (address[] memory){
        return acceptedAuditorUsers[_address];
    }
}