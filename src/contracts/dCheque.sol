// SPDX-License-Identifier: MIT
pragma solidity >=0.8.14;
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

string constant name = "dCheque";
string constant symbol = "dChQ";


contract dCheque {  //is ERC721(name, symbol) 
    struct Cheque{
        address drawer;
        address bearer;
        address auditor;
        uint256 amount;
        uint256 expiry;
        bool voided;
        bool transferable;
    }
    mapping(address=>mapping(address=>bool)) public acceptedAuditor;  // Merchent=>Auditor
    mapping(address=>mapping(address=>bool)) public signerAuditor;  // Signer=>Auditor
    mapping(address=>mapping(uint256=>bool)) public auditorDurations;  // Auditor
    mapping(uint256=>Cheque) public cheques;
    mapping(address=>address) public trustedAccount;  // User's trusted account
    mapping(address=>uint256) public lastTrustedChange;
    mapping(address=>uint256) public deposits;
    mapping(address=>uint256) public chequeCount;
    uint256 totalSupply;

    receive() external payable {
        deposits[msg.sender] += msg.value;
    }
    function ownerOf(uint256 chequeId) external view returns(address){
        return cheques[chequeId].bearer;
    }
    function writeCheque(uint256 amount, uint256 duration, address auditor) public{
        require(auditor!=address(0), "Auditor null address");
        require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        require(signerAuditor[msg.sender][auditor], "Auditor must approve this account");
        deposits[msg.sender] -= amount;
        totalSupply += 1;
        chequeCount[msg.sender]+=1;
        cheques[totalSupply+1] = Cheque({drawer: msg.sender, bearer: msg.sender, expiry: block.timestamp+duration, 
                                         auditor: auditor, amount: amount, voided: false, transferable: true});
    }
    function writeCheque(uint256 amount, uint256 duration, address auditor, address to) external{
        require(auditorDurations[auditor][duration], "Auditor doesn't allow this duration");
        require(signerAuditor[msg.sender][auditor], "Auditor must approve this account");
        require(acceptedAuditor[msg.sender][auditor], "Merchant doesn't accept this auditor");
        deposits[msg.sender] -= amount;
        totalSupply += 1;
        chequeCount[to]+=1;
        cheques[totalSupply+1] = Cheque({drawer: msg.sender, bearer: to, expiry: block.timestamp+duration, 
                                       auditor: auditor, amount:amount, voided:false, transferable:true});
    }
    function cashCheque(uint256 chequeID) external{  // Only allow withdraws via cheque writing
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Must own cheque to cash");
        require(cheque.expiry>block.timestamp, "Cheque not cashable yet");
        require(!cheque.voided, "Cheque invalid");
        cheque.voided = true;
        (bool success, ) = msg.sender.call{value:cheque.amount}("");
        require(success, "Transfer failed.");
        chequeCount[cheque.bearer]-=1;
    }
    function voidCheque(uint256 chequeID) external{
        Cheque storage cheque = cheques[chequeID];
        require(cheque.auditor==msg.sender, "Must be auditor");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        cheque.voided = true;
        chequeCount[cheque.bearer]-=1;
        deposits[cheque.drawer] += cheque.amount;  // Add balance back to signer
    }
    function voidTransferCheque(uint256 chequeID) external {
        Cheque storage cheque = cheques[chequeID];
        require(cheque.auditor==msg.sender, "Must be auditor");
        require(cheque.expiry<block.timestamp, "Cheque already matured");
        cheque.voided = true;
        chequeCount[cheque.bearer]-=1;
        deposits[trustedAccount[cheque.drawer]] += cheque.amount;  // Add balance back to trusted (secondary) account
    }
    function transfer(address to, uint256 chequeID) external{
        Cheque storage cheque = cheques[chequeID];
        require(cheque.bearer==msg.sender, "Only cheque owner can transfer");
        require(cheque.transferable && (!cheque.voided), "Cheque not transferable");
        cheque.bearer = to;
    }
    function setAcceptedAuditor(address auditor) external{  // Merchant will set this
        acceptedAuditor[msg.sender][auditor] = true;
    }
    function getChequeAuditor(uint256 chequeId) external view returns (address){
        return cheques[chequeId].auditor;
    } 
    function setAllowedDuration(uint256 duration) external{  // Auditor will set this
        auditorDurations[msg.sender][duration] = true;
    }
    function setAcceptedSigners(address signer) external{  // Auditor will set this
        signerAuditor[msg.sender][signer] = true;
    }
    function setTrustedAccount(address account) external {
        require((lastTrustedChange[msg.sender] + 180 days)<block.timestamp, "Can only change trusted account once every 180 days");
        trustedAccount[msg.sender] = account;
        lastTrustedChange[msg.sender] += block.timestamp;
    }
    function getChequeDrawer(uint256 chequeId) external view returns (address){
        return cheques[chequeId].drawer;
    }
    function getChequeBearer(uint256 chequeId) external view returns (address){
        return cheques[chequeId].bearer;
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