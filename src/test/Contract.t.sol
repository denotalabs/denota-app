// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "src/contracts/CheqV2.sol";
import "./mock/erc20.sol";

contract ContractTest is Test {
    CRX public cheq;
    TestERC20 public dai;
    TestERC20 public usdc;
    uint256 public immutable tokensCreated = 1_000_000_000_000e18;

    function setUp() public { 
        cheq = new CRX();  // ContractTest is the owner
        dai = new TestERC20(tokensCreated, "DAI", "DAI");  // Sends ContractTest the dai
        usdc = new TestERC20(0, "USDC", "USDC");

        vm.label(msg.sender, "Alice");
        vm.label(address(this), "TestContract");
        vm.label(address(dai), "TestDai");
        vm.label(address(usdc), "TestUSDC");
        vm.label(address(cheq), "CRXcontract");
    }
    function isContract(address _addr) public view returns (bool){
        uint32 size;
        assembly {size := extcodesize(_addr)}
        return (size > 0);
    }

    /*//////////////////////////////////////////////////////////////
                               CHEQ TESTS
    //////////////////////////////////////////////////////////////*/
    function testWhitelist() public {
        SelfSignTimeLock selfSignedTL = new SelfSignTimeLock(cheq);  // How to test successful deployment

        assertFalse(cheq.brokerWhitelist(selfSignedTL), "Unauthorized whitelist");
        cheq.whitelistBroker(selfSignedTL, true);
        assertTrue(cheq.brokerWhitelist(selfSignedTL), "Whitelisting failed");

        cheq.whitelistBroker(selfSignedTL, false);
        assertFalse(cheq.brokerWhitelist(selfSignedTL), "Un-whitelisting failed");
    }

    function testFailWhitelist(address caller) public {
        vm.assume(caller != address(this));  // Deployer can whitelist, test others accounts
        SelfSignTimeLock selfSignedTL = new SelfSignTimeLock(cheq);
        vm.prank(caller);
        cheq.whitelistBroker(selfSignedTL, true);
        assertFalse(cheq.brokerWhitelist(selfSignedTL), "Unauthorized whitelist");
    }

    function setUpTimelock() public returns (SelfSignTimeLock){  // Deploy and whitelist timelock broker
        SelfSignTimeLock selfSignedTL = new SelfSignTimeLock(cheq);
        vm.label(address(selfSignedTL), "SelfSignTimeLock");
        cheq.whitelistBroker(selfSignedTL, true);
        return selfSignedTL;
    }

    function testDeposit(uint256 amount) public {
        vm.assume(amount<=tokensCreated);
        assertTrue(dai.allowance(address(this), address(cheq)) == 0, "Approval started from non-zero");
        dai.approve(address(cheq), amount);
        assertTrue(dai.allowance(address(this), address(cheq)) == amount, "Approval failed");

        assertTrue(cheq.deposits(address(this), dai) == 0, "Deposit started from non-zero");
        cheq.deposit(dai, amount);
        assertTrue(cheq.deposits(address(this), dai) == amount, "Deposit failed");
    }

    function testFailDeposit(address caller, uint256 amount, uint256 random) public {
        vm.assume(caller!= address(this));
        // Deposit from no allowance
        vm.prank(caller);
        cheq.deposit(dai, amount);

        // Deposit more than allowance
        dai.transfer(caller, amount); //  Cheq transfers caller some dai for the test
        vm.startPrank(caller);  // Use caller
        dai.approve(address(cheq), amount);  // Caller approves cheq to take this amount
        cheq.deposit(dai, amount+random+1);  // Caller tries to deposit more dai than they gave cheq to use
    }

    function depositHelper(uint256 amount, address _to) public {
        dai.approve(address(cheq), amount);

        assertTrue(dai.balanceOf(address(cheq)) == 0);
        cheq.deposit(_to, dai, amount);
        assertTrue(dai.balanceOf(address(cheq)) == amount);
        assertTrue(cheq.deposits(_to, dai) == amount, "Dai didn't deposit to _to");
    }

    /*//////////////////////////////////////////////////////////////
                             BROKER TESTS
    //////////////////////////////////////////////////////////////*/
    function cheqWriteCondition(address caller, uint256 amount, address recipient, uint256 duration) public view returns(bool){
        return amount <= tokensCreated &&   // Can't use more token than created
               caller != recipient &&  // Don't self send
               caller != address(0) &&  // Don't vm.prank from address(0)
               recipient != address(0) &&   // Can't send to, or transact from, address(0)
               !isContract(recipient) &&  // Don't send tokens to non-ERC721Reciever contracts
               duration < type(uint).max &&  // Causes overflow
               (duration >> 2) + (block.timestamp >> 2) <= (type(uint).max >> 2); // Causes overflow
    }

    function testWriteCheq(address caller, uint256 amount, address recipient, uint256 duration) public {
        vm.assume(amount > 0  && amount <= dai.totalSupply());
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(recipient != address(0));
        vm.assume(!isContract(recipient));
        vm.assume(caller != recipient);
        vm.assume(duration < type(uint256).max);

        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, caller);

        assertTrue(cheq.balanceOf(caller) == 0, "Caller already had a cheq");
        assertTrue(cheq.balanceOf(recipient) == 0, "Recipient already had a cheq");
        assertTrue(cheq.totalSupply() == 0, "Cheq supply non-zero");

        vm.prank(caller); 
        uint256 cheqId = sstl.writeCheq(dai, amount, amount, recipient, duration);  // Cheqs require amount == escrowed
        assertTrue(cheq.deposits(caller, dai) == 0, "Dai balance didn't decrement");
        assertTrue(cheq.totalSupply() == 1, "Cheq supply didn't increment");
        assertTrue(cheq.ownerOf(cheqId) == recipient, "Recipient isn't owner");
        assertTrue(cheq.balanceOf(caller) == 0, "Sender got a cheq");
        assertTrue(cheq.balanceOf(recipient) == 1, "Recipient didnt get a cheq");

        // ICheqBroker wrote correctly to CRX storage
        (IERC20 token, uint256 amount1, /* uint256 escrowed */, address drawer, address recipient1, ICheqBroker broker) = cheq.cheqInfo(cheqId);
        assertTrue(amount1 == amount, "Incorrect amount");
        assertTrue(token == dai, "Incorrect token");
        assertTrue(drawer == caller, "Incorrect drawer");
        assertTrue(recipient1 == recipient, "Incorrect recipient");
        assertTrue(address(broker) == address(sstl), "Incorrect broker");
        
        // ICheqBroker wrote correctly to it's storage
        assertTrue(sstl.cheqFunder(cheqId) == caller, "Incorrect funder");
        assertTrue(sstl.cheqReceiver(cheqId) == recipient, "Cheq reciever is not same as on SSTL");
        assertTrue(sstl.cheqCreated(cheqId) == block.timestamp, "Incorrect created");
        assertTrue(sstl.cheqInspectionPeriod(cheqId) == duration, "Incorrect expired");
    }

    function testWriteInvoice(address caller, address recipient, uint256 duration, uint256 amount) public {
        vm.assume(amount == 0);
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(recipient != address(0));
        vm.assume(!isContract(recipient));
        vm.assume(duration < type(uint256).max);
        
        assertTrue(cheq.balanceOf(caller) == 0, "Caller already had a cheq");
        assertTrue(cheq.balanceOf(recipient) == 0);
        assertTrue(cheq.totalSupply() == 0, "Cheq supply non-zero");
        
        SelfSignTimeLock sstl = setUpTimelock();
        vm.prank(caller);
        uint256 cheqId = sstl.writeCheq(dai, amount, 0, recipient, duration);
        assertTrue(cheq.deposits(caller, dai) == 0, "Writer gained a deposit");
        assertTrue(cheq.totalSupply() == 1, "Cheq supply didn't increment");
        assertTrue(cheq.balanceOf(caller) == 1, "Invoicer didn't get a cheq");
        assertTrue(cheq.balanceOf(recipient) == 0, "Recipient gained a cheq");
        assertTrue(cheq.ownerOf(cheqId) == caller, "Invoicer isn't owner");
        
        (IERC20 token, uint256 amount1, uint256 escrowed, address drawer, address recipient1, ICheqBroker broker) = cheq.cheqInfo(cheqId);
        // ICheqBroker wrote correctly to CRX
        assertTrue(token == dai, "Incorrect token");
        assertTrue(amount1 == amount, "Incorrect amount");
        assertTrue(escrowed == 0, "Incorrect escrowed amount");
        assertTrue(drawer == caller, "Incorrect drawer");
        assertTrue(recipient1 == recipient, "Incorrect recipient");
        assertTrue(address(broker) == address(sstl), "Incorrect broker");
        
        // ICheqBroker wrote correctly to it's storage
        assertTrue(sstl.cheqFunder(cheqId) == recipient, "Cheq reciever is same as on cheq");
        assertTrue(sstl.cheqReceiver(cheqId) == caller, "Cheq reciever is same as on SSTL");
        assertTrue(sstl.cheqCreated(cheqId) == block.timestamp, "Cheq created not at block.timestamp");
        assertTrue(sstl.cheqInspectionPeriod(cheqId) == duration, "Expired");
    }

    function testFailWriteCheq(address caller, uint256 amount, address recipient, uint256 duration) public {
        vm.assume(amount <= dai.totalSupply());
        vm.assume(amount >0);
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(recipient != address(0));
        vm.assume(!isContract(recipient));
        vm.assume(caller != recipient);
        vm.assume(duration < type(uint256).max);

        SelfSignTimeLock sstl = setUpTimelock();
        // Can't write cheq without a deposit on crx
        vm.prank(caller);
        sstl.writeCheq(dai, amount, amount, recipient, duration);
        // Can't write cheques with insufficient balance
        depositHelper(amount, caller);
        sstl.writeCheq(dai, amount, amount + 1, recipient, duration);  // Not enough escrow and amount!=escrow && escrow>0
        sstl.writeCheq(dai, amount + 1, amount + 1, recipient, duration);  // Not enough escrow

        // Can't write directly from cheq
        vm.prank(caller);
        cheq.write(caller, recipient, dai, amount, amount, recipient);
        
        // Can't write a 0 amount cheq??
        vm.prank(caller);
        sstl.writeCheq(dai, 0, amount, recipient, duration);
        
        // Can't write a cheq with a higher escrow than amount??
        vm.prank(caller);
        sstl.writeCheq(dai, amount, amount + 1, recipient, duration);
    }

    function helperCheqInfo(uint256 cheqId, uint256 amount, address sender, address recipient, SelfSignTimeLock sstl, uint256 duration) public {  // BUG: too many local variables
        (IERC20 token, uint256 amount1, uint256 escrowed, address drawer, address recipient1, ICheqBroker broker) = cheq.cheqInfo(cheqId);
        // ICheqBroker wrote correctly to CRX
        assertTrue(token == dai, "Incorrect token");
        assertTrue(amount1 == amount, "Incorrect amount");
        assertTrue(recipient1 == recipient, "Incorrect recipient");
        assertTrue(drawer == sender, "Incorrect drawer");
        assertTrue(address(broker) == address(sstl), "Incorrect broker");

        // ICheqBroker wrote correctly to it's storage
        if (sstl.cheqFunder(cheqId) == sender){  // Cheq
            assertTrue(escrowed == amount, "Incorrect escrowed amount");
            assertTrue(sstl.cheqFunder(cheqId) == drawer, "Cheq funder is not the sender");
            assertTrue(sstl.cheqReceiver(cheqId) == recipient, "Cheq reciever is not recipient"); 
        } else {  // Invoice
            assertTrue(escrowed == 0, "Incorrect escrowed amount");
            assertTrue(sstl.cheqFunder(cheqId) == recipient1, "Cheq reciever is same as on cheq");
            assertTrue(sstl.cheqReceiver(cheqId) == drawer, "Cheq reciever is same as on SSTL"); 
        }
        assertTrue(sstl.cheqCreated(cheqId) == block.timestamp, "Cheq created not at block.timestamp");
        assertTrue(sstl.cheqInspectionPeriod(cheqId) == duration, "Expired");
    }

    function writeHelper(address sender, uint256 amount, uint256 escrow, address recipient, uint256 duration, SelfSignTimeLock sstl) public returns(uint256){ 
        uint256 senderBalanceOf = cheq.balanceOf(sender);
        uint256 recipientBalanceOf = cheq.balanceOf(recipient);
        uint256 cheqSupply = cheq.totalSupply();
        assertTrue(cheq.balanceOf(sender) == 0, "Caller already got a cheq");
        assertTrue(cheq.balanceOf(recipient) == 0);

        vm.prank(sender);
        uint256 cheqId = sstl.writeCheq(dai, amount, escrow, recipient, duration);  // Change dai to arbitrary token
        helperCheqInfo(cheqId, amount, sender, recipient, sstl, duration);

        if (escrow == amount && amount != 0){ // Cheq 
            assertTrue(cheq.deposits(sender, dai) == 0, "Writer gained a deposit"); 
            assertTrue(cheq.balanceOf(sender) == senderBalanceOf, "Recipient gained a cheq"); 
            assertTrue(cheq.balanceOf(recipient) == recipientBalanceOf + 1, "Recipient didnt get a cheq"); 
            assertTrue(cheq.ownerOf(cheqId) == recipient, "Recipient isn't owner"); 
        } else {  // Invoice
            // assertTrue(cheq.deposits(sender, dai) == 0, "Writer gained a deposit"); 
            assertTrue(cheq.balanceOf(sender) == senderBalanceOf + 1, "Invoicer didn't get a cheq");
            assertTrue(cheq.balanceOf(recipient) == recipientBalanceOf, "Funder gained a cheq");
            assertTrue(cheq.ownerOf(cheqId) == sender, "Invoicer isn't owner");
        }
        assertTrue(cheq.totalSupply() == cheqSupply + 1, "Cheq supply didn't increment");

        return cheqId;
    }

    function testTransferCheq(address caller,  uint256 amount, address recipient, uint256 duration, address to) public {
        vm.assume(amount <= dai.totalSupply());
        vm.assume(amount > 0);
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(recipient != address(0));
        vm.assume(to != address(0));
        vm.assume(!isContract(recipient));
        vm.assume(caller != recipient);
        vm.assume(duration < type(uint256).max);

        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, caller);
        uint256 cheqId = writeHelper(caller, amount, amount, recipient, duration, sstl);
        vm.prank(recipient);
        sstl.transferCheq(cheqId, to);
    }

    function testFailTransferCheq(address caller, uint256 amount, address recipient, uint256 duration, address to) public {
        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, caller);  // caller is writer
        uint256 cheqId = writeHelper(caller, amount, amount, recipient, duration, sstl);
        // Non-owner transfer
        vm.prank(caller);
        sstl.transferCheq(cheqId, to);
        // Transfer of non-existent cheq
        vm.prank(caller);
        sstl.transferCheq(cheqId+1, to);
    }

    function testTransferInvoice(address caller, uint256 amount, address recipient, uint256 duration, address to) public {
        vm.assume(amount <= dai.totalSupply());
        vm.assume(amount > 0);
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(recipient != address(0));
        vm.assume(to != address(0));
        vm.assume(!isContract(recipient));
        vm.assume(!isContract(caller));
        vm.assume(caller != recipient);
        vm.assume(duration < type(uint256).max);

        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, caller);
        uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);
        vm.prank(caller);
        sstl.transferCheq(cheqId, to);
    }

    function testFailTransferInvoice(address caller, uint256 amount, address recipient, uint256 duration, address to) public {
        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, caller);
        uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);

        // Non-owner transfer
        sstl.transferCheq(cheqId, to);
        vm.prank(recipient);
        sstl.transferCheq(cheqId, to);
        // Transfer to address(0)
        vm.prank(caller);
        sstl.transferCheq(cheqId, address(0));
        // Transfer to contract
        vm.prank(caller);
        sstl.transferCheq(cheqId, address(this));
        // Transfer of non-existent cheq
        sstl.transferCheq(cheqId+1, to);
    }
    
    function transferHelper(uint256 cheqId, address to, SelfSignTimeLock sstl) public {
        vm.prank(cheq.ownerOf(cheqId));
        sstl.transferCheq(cheqId, to);
    }

    function testFundInvoice(address caller, uint256 amount, address recipient, uint256 duration) public {  //
        vm.assume(amount <= dai.totalSupply());
        vm.assume(amount > 0);
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(recipient != address(0));
        vm.assume(!isContract(recipient));
        vm.assume(!isContract(caller));
        vm.assume(caller != recipient);
        vm.assume(duration < type(uint256).max);

        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, recipient);  // Recipient will be the funder
        uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);
        vm.prank(recipient);  // This can be anybody
        sstl.fundCheq(cheqId, amount);

        vm.expectRevert(bytes("Cant fund this amount"));
        sstl.fundCheq(cheqId, amount);
    }

    function testFailFundInvoice(address caller, uint256 amount, address recipient, uint256 duration, uint256 random) public {
        vm.assume(random != 0);

        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, recipient);  // Recipient will be the funder
        uint256 cheqId = writeHelper(caller, amount, amount, recipient, duration, sstl);
        vm.prank(recipient); 
        sstl.fundCheq(cheqId, amount);
        vm.prank(caller);
        sstl.fundCheq(cheqId, amount);

        // invoice but not correct amount?
        depositHelper(amount, recipient);  // Recipient will be the funder
        uint256 cheqId2 = writeHelper(caller, amount, 0, recipient, duration, sstl);
        vm.prank(recipient); 
        sstl.fundCheq(cheqId2, amount+random);
        sstl.fundCheq(cheqId2, amount-random);
        vm.prank(caller);
        sstl.fundCheq(cheqId2, amount+random);
        sstl.fundCheq(cheqId2, amount-random);
    }

    function testCashCheq(address caller, uint256 amount, address recipient, uint256 duration) public {
        vm.assume(amount <= dai.totalSupply());
        vm.assume(amount > 0);
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(recipient != address(0));
        vm.assume(!isContract(recipient));
        vm.assume(caller != recipient);
        vm.assume(duration < type(uint256).max);

        SelfSignTimeLock sstl = setUpTimelock();
        // Write cheq from: caller, owner: recipient, to: recipient
        depositHelper(amount, caller);  
        console.log("Supply", cheq.totalSupply());
        uint256 cheqId = writeHelper(caller, amount, amount, recipient, duration, sstl);
        console.log("ID", cheqId);
        
        vm.startPrank(recipient);
        vm.warp(block.timestamp + duration);
        sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId));
        vm.stopPrank();
    }

    function testCashInvoice(address caller, uint256 amount, address recipient, uint256 duration) public {
        vm.assume(amount <= dai.totalSupply());  //amount > 0  && 
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(recipient != address(0));
        vm.assume(!isContract(recipient));
        vm.assume(!isContract(caller));
        vm.assume(caller != recipient);
        vm.assume(duration < type(uint256).max);

        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, recipient);
        uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);

        vm.prank(recipient);
        sstl.fundCheq(cheqId, amount);

        vm.startPrank(caller);
        vm.warp(block.timestamp + duration);
        sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId));
        vm.stopPrank();
    }

    function testFailCashCheq(address caller, uint256 amount, address recipient, uint256 duration, uint256 random) public {
        vm.assume(amount != 0);
        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, recipient);
        uint256 cheqId = writeHelper(caller, amount, amount, recipient, duration, sstl);
        // Can't cash until its time
        vm.prank(recipient);
        sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId));
        // Can't cash unless owner
        vm.warp(block.timestamp + duration);
        sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId));
        // Can't cash different amount
        sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId)-random);
    }

    function testFailCashInvoice(address caller, uint256 amount, address recipient, uint256 duration, uint256 random) public {
        vm.assume(random != 0);
        vm.assume(amount != 0);
        // if (!cheqWriteCondition(caller, amount, recipient, duration) || amount != 0){
        //     require(false, "bad fuzzing");
        // }
        SelfSignTimeLock sstl = setUpTimelock();
        depositHelper(amount, recipient);  
        uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);

        // Can't cash unfunded invoice
        // vm.warp(block.timestamp + duration);
        // sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId));  // You can cash an unfunded cheq after inspectionPeriod

        sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId)+1);
    }
}