// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;


contract dCheque {
    struct Cheque{
        address drawer;
        address recipient;
        address bearer;
        address auditor;
        uint256 amount;
        uint256 expiry;
        bool voided;
        bool transferable;
    }
    mapping(address=>mapping(address=>bool)) public userAuditor;  // Whether User accepts Auditor
    mapping(address=>address[]) public acceptedUserAuditors;  // Auditor addresses that user accepts
    mapping(address=>mapping(address=>bool)) public auditorUser;  // Whether Auditor accepts User
    mapping(address=>address[]) public acceptedAuditorUsers;  // User addresses that auditor accepts
    mapping(address=>mapping(uint256=>bool)) public auditorDurations;  // Auditor voiding periods

    mapping(uint256=>Cheque) public cheques;
    mapping(address=>uint256) public chequeCount;  // User's balance of cheques
    mapping(address=>uint256) public deposits;  // Total user deposits
    uint256 public totalSupply;  // Total cheques created

    mapping(address=>address) public trustedAccount;  // User's trusted account
    mapping(address=>uint256) public lastTrustedChange;
    uint256 public trustedAccountCooldown = 180 days;
    uint256 public protocolFee;
    uint256 public protocolReserve;

    event Deposit(address indexed from, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 indexed chequeID);
    event Void(address indexed drawer, address indexed auditor, uint256 indexed chequeID);
    event Cash(address indexed bearer, uint256 indexed chequeID);
    event AcceptAuditor(address indexed user, address indexed auditor);
    event AcceptUser(address indexed auditor, address indexed user);
    event Withdraw(address indexed _address, uint256 amount);
    event SetProtocolFee(uint256 amount);

    function _deposit(address _address, uint256 _amount) private {
        deposits[_address] += _amount;
        emit Deposit(_address, _amount);
    }
    receive() external payable {
        _deposit(msg.sender, msg.value);
    }
    function depositTo(address _address) external payable {
        _deposit(_address, msg.value);
    }
    function setProtocolFee(uint256 _protocolFee) external {
        protocolFee = _protocolFee;
        emit SetProtocolFee(_protocolFee);
    }
    function writeCheque(uint256 amount, uint256 duration, address auditor) public {
        require(deposits[msg.sender]>=amount, "Writing more than available");
        require(userAuditor[msg.sender][auditor], "User must approve this auditor");
        require(auditorUser[auditor][msg.sender],  "Auditor must approve this account");
        require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        deposits[msg.sender] -= amount;
        totalSupply += 1;
        chequeCount[msg.sender]+=1;
        cheques[totalSupply] = Cheque({drawer: msg.sender, recipient:msg.sender, bearer: msg.sender, expiry: block.timestamp+duration, 
                                         auditor: auditor, amount: amount, voided: false, transferable: true});
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
    function writeCheque(uint256 amount, uint256 duration, address auditor, address recipient) public {
        require(deposits[msg.sender]>=amount, "Writing more than available");
        require(userAuditor[msg.sender][auditor], "You must approve this auditor");
        require(userAuditor[recipient][auditor], "Recipient must approve this auditor");
        require(auditorUser[auditor][msg.sender],  "Auditor must approve you");
        require(auditorUser[auditor][recipient],  "Auditor must approve this recipient");
        require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        deposits[msg.sender] -= amount;
        totalSupply += 1;
        chequeCount[recipient]+=1;
        cheques[totalSupply] = Cheque({drawer: msg.sender, recipient:recipient, bearer: recipient, expiry: block.timestamp+duration, 
                                         auditor: auditor, amount: amount, voided: false, transferable: true});
        emit Transfer(msg.sender, recipient, totalSupply);
    }
    function cashCheque(uint256 chequeID) external {  // Only allow withdraws via cheque writing
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Must own cheque to cash");
        require(cheque.expiry>block.timestamp, "Cheque not cashable yet");
        require(!cheque.voided, "Cheque invalid");
        cheque.voided = true;
        (bool success, ) = msg.sender.call{value:cheque.amount}("");
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
        deposits[cheque.drawer] += cheque.amount;  // Add balance back to signer
        emit Void(cheque.drawer, cheque.auditor, chequeID);
    }
    function voidRescueCheque(uint256 chequeID) external {
        Cheque storage cheque = cheques[chequeID];
        require(cheque.auditor==msg.sender, "Must be auditor");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        cheque.voided = true;
        cheque.transferable = false;
        chequeCount[cheque.bearer]-=1;
        address fallbackAccount = trustedAccount[cheque.drawer];
        deposits[fallbackAccount] += cheque.amount;  // Add cheque amount to trusted account deposit balance
        emit Void(cheque.drawer, cheque.auditor, chequeID);
        emit Transfer(cheque.bearer, fallbackAccount, chequeID);
    }
    function transfer(address to, uint256 chequeID) public {
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Only cheque owner can transfer");
        require(cheque.transferable, "Cheque not transferable");
        cheque.amount -= protocolFee;
        protocolReserve += protocolFee;
        cheque.bearer = to;
        emit Transfer(msg.sender, to, chequeID);
    }
    function withdraw(uint256 _amount) external{ // ONLY OWNER
        require(protocolReserve>=_amount, "Can't withdraw more than available");
        protocolReserve -= _amount;
        (bool success, ) = msg.sender.call{value:_amount}("");
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
    function getAcceptedUserAuditors(address _address) external view returns (address[] memory){
        return acceptedUserAuditors[_address];
    }
    function getAcceptedAuditorUsers(address _address) external view returns (address[] memory){
        return acceptedAuditorUsers[_address];
    }
}