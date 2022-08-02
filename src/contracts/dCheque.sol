// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;


contract dCheque {
    struct Cheque{
        address drawer;
        address bearer;
        address auditor;
        uint256 amount;
        uint256 expiry;
        bool voided;
        bool transferable;
    }
    // Need to give array of approved addresses for merchant and auditor
    mapping(address=>mapping(address=>bool)) public merchantAuditor;  // Merchent=>Auditor
    mapping(address=>uint256) public acceptedMerchantAuditorCount;  // Merchent=>Auditor

    mapping(address=>mapping(address=>bool)) public signerAuditor;  // Signer=>Auditor
    mapping(address=>address[]) public signerAuditorArray;  // Signer=>Auditor

    // mapping(address=>mapping(uint256=>bool)) public auditorDurations;  // Auditor
    mapping(uint256=>Cheque) public cheques;
    mapping(address=>uint256) public chequeCount;
    mapping(address=>address) public trustedAccount;  // User's trusted account
    mapping(address=>uint256) public lastTrustedChange;
    mapping(address=>uint256) public deposits;

    uint256 private totalSupply;
    uint256 private trustedAccountCooldown;
    uint256 private transferFee;

    event Deposit(address indexed from, uint256 amount);
    event Transfer(address indexed from, address indexed to);
    event Void(address indexed drawer, address indexed auditor, uint256 indexed chequeId);
    event Cash(address indexed bearer, uint256 indexed chequeId);
    event acceptAuditor(address indexed merchant, address indexed auditor);
    event acceptUser(address indexed auditor, address indexed user);

    constructor(){
        trustedAccountCooldown = 180;
        transferFee = 250;
    }

    receive() external payable{
        emit Deposit(msg.sender, msg.value);
        deposits[msg.sender] += msg.value;
    }
    function ownerOf(uint256 chequeId) external view returns(address) {
        return cheques[chequeId].bearer;
    }
    function writeCheque(uint256 amount, uint256 duration, address auditor) public {
        require(deposits[msg.sender]>=amount, "Writing more than available");
        require(auditor!=address(0), "Auditor null address");
        // require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        require(signerAuditor[msg.sender][auditor], "Auditor must approve this account");
        deposits[msg.sender] -= amount;
        totalSupply += 1;
        chequeCount[msg.sender]+=1;
        cheques[totalSupply+1] = Cheque({drawer: msg.sender, bearer: msg.sender, expiry: block.timestamp+duration, 
                                         auditor: auditor, amount: amount, voided: false, transferable: true});
        emit Transfer(msg.sender, msg.sender);
    }
    function writeCheque(uint256 amount, uint256 duration, address auditor, address to) public {
        require(deposits[msg.sender]>=amount, "Writing more than available");
        // require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        require(signerAuditor[msg.sender][auditor], "Auditor must approve this account");
        require(merchantAuditor[msg.sender][auditor], "Merchant doesn't accept this auditor");
        deposits[msg.sender] -= amount;
        totalSupply += 1;
        chequeCount[to]+=1;
        cheques[totalSupply+1] = Cheque({drawer: msg.sender, bearer: to, expiry: block.timestamp+duration, 
                                       auditor: auditor, amount:amount, voided:false, transferable:true});
        emit Transfer(msg.sender, to);
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
        chequeCount[cheque.bearer]-=1;
        deposits[cheque.drawer] += cheque.amount;  // Add balance back to signer
        emit Void(cheque.drawer, cheque.auditor, chequeID);
    }
    function voidRescueCheque(uint256 chequeID) external {
        Cheque storage cheque = cheques[chequeID];
        require(cheque.auditor==msg.sender, "Must be auditor");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        cheque.voided = true;
        chequeCount[cheque.bearer]-=1;
        deposits[trustedAccount[cheque.drawer]] += cheque.amount;  // Add balance back to trusted (secondary) account
        emit Void(cheque.drawer, cheque.auditor, chequeID);
    }
    function transfer(address to, uint256 chequeID) external {
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Only cheque owner can transfer");
        require(cheque.transferable && (!cheque.voided), "Cheque not transferable");
        cheque.bearer = to;
        emit Transfer(msg.sender, to);
    }
    function setmerchantAuditor(address auditor) external {  // Merchant will set this
        merchantAuditor[msg.sender][auditor] = true;
    }
    function getChequeAuditor(uint256 chequeId) external view returns (address) {
        return cheques[chequeId].auditor;
    } 
    // function setAllowedDuration(uint256 duration) external {  // Auditor will set this
    //     auditorDurations[msg.sender][duration] = true;
    // }
    function setAcceptedDrawers(address signer) external {  // Auditor will set this
        signerAuditor[msg.sender][signer] = true;
    }
    function setTrustedAccount(address account) external {
        require((lastTrustedChange[msg.sender] + 180 days)<block.timestamp, "Can only change trusted account once every 180 days");
        trustedAccount[msg.sender] = account;
        lastTrustedChange[msg.sender] += block.timestamp;
    }
    function getChequeDrawer(uint256 chequeId) external view returns (address) {
        return cheques[chequeId].drawer;
    }
    function getChequeBearer(uint256 chequeId) external view returns (address) {
        return cheques[chequeId].bearer;
    }
    function chequeExpiry(uint256 chequeId) external view returns (uint256) {
        return cheques[chequeId].expiry;
    }
    function chequeAmount(uint256 chequeId) external view returns (uint256) {
        return cheques[chequeId].amount;
    }
    function chequeVoided(uint256 chequeId) external view returns (bool) {
        return cheques[chequeId].voided;
    }
    function chequeTransferable(uint256 chequeId) external view returns (bool) {
        return cheques[chequeId].transferable;
    }
}