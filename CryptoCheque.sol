// SPDX-License-Identifier: UNLICENSED

contract CryptoCheque {
    struct Cheque{
        address drawer;
        address bearer;
        address reviewer;
        uint256 expiry;
        uint256 amount;
        bool voided;
        bool transferable;
    }
    mapping(address=>uint256) private balances;
    mapping(uint256=>Cheque) public cheques;
    mapping(address=>mapping(address=>bool)) public acceptedReviewer;  // Merchent=>Reviewer
    mapping(address=>mapping(address=>bool)) public signerReviewer;  // Signer=>Reviewer
    mapping(address=>mapping(uint256=>bool)) public reviewerDurations;  // Reviewer
    mapping(address=>address) public trustedAccount;  // User's trusted account
    mapping(address=>uint256) public lastTrustedChange;
    uint256 totalSupply;

    function deposit() payable external {
        balances[msg.sender] += msg.value;
    }
    function writeCheque(uint256 amount, uint256 duration, address reviewer) public{
        require(reviewerDurations[reviewer][duration], "Reviewer doesn't allow this duration");
        require(signerReviewer[msg.sender][reviewer], "Reviewer must approve this account");
        balances[msg.sender] -= amount;
        totalSupply += 1;
        cheques[totalSupply+1] = Cheque({drawer: msg.sender, bearer: msg.sender, expiry: block.timestamp+duration, 
                                         reviewer: reviewer, amount: amount, voided: false, transferable: true});
    }
    function writeCheque(uint256 amount, uint256 duration, address reviewer, address to) external{
        require(reviewerDurations[reviewer][duration], "Reviewer doesn't allow this duration");
        require(signerReviewer[msg.sender][reviewer], "Reviewer must approve this account");
        balances[msg.sender] -= amount;
        totalSupply += 1;
        cheques[totalSupply+1] = Cheque({drawer: msg.sender, bearer: to, expiry: block.timestamp+duration, 
                                       reviewer: reviewer, amount:amount, voided:false, transferable:true});
    }
    function cashCheque(uint256 chequeID) external{  // Only allow withdraws via cheque writing
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Must own cheque to cash");
        require(cheque.expiry>block.timestamp, "Cheque not cashable yet");
        require(!cheque.voided, "Cheque invalid");
        cheque.voided = true;
        this.transfer(cheque.bearer, cheque.amount);
    }
    function voidCheque(uint256 chequeID) external{
        Cheque storage cheque = cheques[chequeID];
        require(cheque.reviewer==msg.sender, "Must be reviewer");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        cheque.voided = true;
        balances[cheque.drawer] += cheque.amount;  // Add balance back to signer
    }
    function voidTransferCheque(uint256 chequeID) external {
        Cheque storage cheque = cheques[chequeID];
        require(cheque.reviewer==msg.sender, "Must be reviewer");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        cheque.voided = true;
        balances[trustedAccount[cheque.drawer]] += cheque.amount;  // Add balance back to trusted (secondary) account
    }
    function transfer(address to, uint256 chequeID) external{
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Only cheque owner can transfer");
        require(cheque.transferable, "Cheque not transferable");
        cheque.bearer = to;
    }
    function balanceOf(address _address) public view returns(uint256){
        return balances[_address];
    }
    function setAcceptedReviewer(address reviewer) external{  // Merchant will set this
        acceptedReviewer[msg.sender][reviewer] = true;
    }
    function setAllowedDuration(uint256 duration) external{  // Reviewer will set this
        reviewerDurations[msg.sender][duration] = true;
    }
    function setAcceptedSigners(address signer) external{  // Reviewer will set this
        signerReviewer[msg.sender][signer] = true;
    }
    function setTrustedAccount(address account) external {
        require((lastTrustedChange[msg.sender] + 30 days)<block.timestamp, "Can only change trusted account once every 30 days");
        trustedAccount[msg.sender] = account;
        lastTrustedChange[msg.sender] += block.timestamp;
    }
    function getChequeDrawer(uint256 chequeId) external view returns (address){
        return cheques[chequeId].drawer;
    }
    function getChequeBearer(uint256 chequeId) external view returns (address){
        return cheques[chequeId].bearer;
    }
    function getChequeReviewer(uint256 chequeId) external view returns (address){
        return cheques[chequeId].reviewer;
    }    
    function getChequeExpiry(uint256 chequeId) external view returns (uint256){
        return cheques[chequeId].expiry;
    }
    function getChequeAmount(uint256 chequeId) external view returns (uint256){
        return cheques[chequeId].amount;
    }
    function getChequeVoided(uint256 chequeId) external view returns (bool){
        return cheques[chequeId].voided;
    }
    function getChequeTransferable(uint256 chequeId) external view returns (bool){
        return cheques[chequeId].transferable;
    }
}
