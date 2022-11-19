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
    uint256 immutable tokenAllocation = 1_000_000_000_000e18;

    function setUp() public { 
        cheq = new CRX();  // ContractTest is the owner
        dai = new TestERC20(tokenAllocation, "DAI", "DAI");  // Sends ContractTest the dai
        usdc = new TestERC20(0, "USDC", "USDC");
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
        SelfSignTimeLock selfSignedTL = new SelfSignTimeLock(cheq);

        assertFalse(cheq.brokerWhitelist(selfSignedTL));
        
        cheq.whitelistBroker(selfSignedTL, true);
        assertTrue(cheq.brokerWhitelist(selfSignedTL));

        cheq.whitelistBroker(selfSignedTL, false);
        assertFalse(cheq.brokerWhitelist(selfSignedTL));
    }

    function testFailWhitelist(address caller) public {
        SelfSignTimeLock selfSignedTL = new SelfSignTimeLock(cheq);
        if (caller != address(this)){  // Deployer can whitelist, test others
            vm.prank(caller);
            cheq.whitelistBroker(selfSignedTL, true);
        }
    }

    function setUpTimelock() public returns (SelfSignTimeLock){
        SelfSignTimeLock selfSignedTL = new SelfSignTimeLock(cheq);
        cheq.whitelistBroker(selfSignedTL, true);
        return selfSignedTL;
    }

    function testDeposit(uint256 _amount) public {
        if (_amount<=tokenAllocation && _amount>0){
            dai.approve(address(cheq), _amount);
            assertTrue(dai.allowance(address(this), address(cheq)) == _amount);

            cheq.deposit(dai, _amount);
            assertTrue(cheq.deposits(address(this), dai) == _amount);
        }
    }
    function testFailDeposit(address caller, uint256 _amount) public {
        if (caller!=address(this)){
            vm.prank(caller);
            cheq.deposit(dai, _amount);
        } else {
            require(false, "bad fuzz");
        }
    }

    function depositHelper(uint256 amount, address _to) public {
        dai.approve(address(cheq), amount);
        assertTrue(dai.balanceOf(address(cheq)) == 0);
        cheq.deposit(_to, dai, amount);
        assertTrue(dai.balanceOf(address(cheq)) == amount);
    }

    /*//////////////////////////////////////////////////////////////
                             BROKER TESTS
    //////////////////////////////////////////////////////////////*/
    function testWriteCheq(uint256 amount, uint256 escrowed, address recipient, uint256 duration) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (
            amount >= escrowed && 
            escrowed > 0 && 
            amount > 0 && 
            amount <= tokenAllocation && 
            recipient != address(0) && 
            recipient != address(sstl) && 
            recipient != address(this) &&
            recipient != address(cheq) &&
            recipient != address(dai) &&
            recipient != address(usdc) &&
            duration != 0) {
            depositHelper(amount, msg.sender);
            assertTrue(cheq.balanceOf(msg.sender) == 0);
            assertTrue(cheq.balanceOf(recipient) == 0);

            vm.prank(msg.sender);
            uint256 cheqId = sstl.writeCheq(dai, amount, escrowed, recipient, duration);
            (IERC20 token, uint256 amount1, uint256 escrowed1, address drawer, address recipient1, ICheqBroker broker) = cheq.cheqInfo(cheqId);
            // ICheqBroker wrote correctly to CRX
            assertTrue(amount1 == amount, "amount");
            assertTrue(escrowed1 == escrowed, "escrowed amount");
            assertTrue(token == dai, "token");
            assertTrue(drawer == msg.sender, "drawer");
            assertTrue(recipient1 == recipient, "recipient");
            assertTrue(address(broker) == address(sstl), "broker");
            
            // ICheqBroker wrote correctly to it's storage
            assertTrue(sstl.cheqFunder(cheqId) == msg.sender, "Funder");
            assertTrue(sstl.cheqReceiver(cheqId) == recipient, "Cheq reciever is same as on SSTL");
            assertTrue(sstl.cheqReceiver(cheqId) == recipient1, "Cheq reciever is same as on cheq");
            assertTrue(sstl.cheqCreated(cheqId) == block.timestamp, "Created");
            assertTrue(sstl.cheqInspectionPeriod(cheqId) == duration, "Expired");

            assertTrue(cheq.balanceOf(msg.sender) == 0, "drawer balance");
            assertTrue(cheq.balanceOf(recipient) == 1, "recipient");
            assertTrue(cheq.ownerOf(cheqId) == recipient, "owner");
        }
    }

    function testWriteInvoice(address recipient, uint256 duration, uint256 amount) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (
            amount > 0 && 
            amount <= tokenAllocation && 
            recipient != address(0) && 
            recipient != address(sstl) && 
            recipient != address(this) &&
            recipient != address(cheq) &&
            duration > 0) {
            assertTrue(cheq.balanceOf(msg.sender) == 0);
            assertTrue(cheq.balanceOf(recipient) == 0);
            
            vm.prank(msg.sender);
            uint256 cheqId = sstl.writeCheq(dai, amount, 0, recipient, duration);
            (IERC20 token, uint256 amount1, uint256 escrowed, address drawer, address recipient1, ICheqBroker broker) = cheq.cheqInfo(cheqId);
            // ICheqBroker wrote correctly to CRX
            assertTrue(amount1 == amount, "amount");
            assertTrue(escrowed == 0, "escrowed amount");
            assertTrue(token == dai, "token");
            assertTrue(drawer == msg.sender, "drawer");
            assertTrue(recipient1 == recipient, "recipient");
            assertTrue(address(broker) == address(sstl), "broker");
            
            // ICheqBroker wrote correctly to it's storage
            assertTrue(sstl.cheqFunder(cheqId) == recipient, "Funder");
            assertTrue(sstl.cheqReceiver(cheqId) == msg.sender, "Cheq reciever is same as on SSTL");
            assertTrue(sstl.cheqFunder(cheqId) == recipient1, "Cheq reciever is same as on cheq");
            assertTrue(sstl.cheqCreated(cheqId) == block.timestamp, "Created");
            assertTrue(sstl.cheqInspectionPeriod(cheqId) == duration, "Expired");

            assertTrue(cheq.balanceOf(msg.sender) == 1, "recipient");
            assertTrue(cheq.ownerOf(cheqId) == msg.sender, "owner");
        }
    }

    function testFailWriteCheq(uint256 amount, address recipient, uint256 duration) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (amount > 0 && 
            amount <= tokenAllocation && 
            recipient != address(0) && 
            recipient != address(sstl) && 
            recipient != address(this) &&
            recipient != address(cheq) &&
            duration > 0){
            console.log(recipient);
            // Can't write cheq without a deposit on crx
            vm.prank(msg.sender);
            sstl.writeCheq(dai, amount, amount, recipient, duration);
            // Can't write cheques with insufficient balance
            depositHelper(amount, msg.sender);
            sstl.writeCheq(dai, amount, amount + 1, recipient, duration);  // Not enough escrow and amount!=escrow && escrow>0
            sstl.writeCheq(dai, amount + 1, amount + 1, recipient, duration);  // Not enough escrow

            // Can't write directly from cheq
            vm.prank(msg.sender);
            cheq.write(msg.sender, recipient, dai, amount, amount, recipient);
            
            // Can't write a 0 amount cheq??
            vm.prank(msg.sender);
            sstl.writeCheq(dai, 0, amount, recipient, duration);
            
            // Can't write a cheq with a higher escrow than amount??
            vm.prank(msg.sender);
            sstl.writeCheq(dai, amount, amount + 1, recipient, duration);
        } else {
            require(false, "false");
        }
    }

    function writeHelper(address caller, uint256 amount, uint256 escrow, address recipient, uint256 duration, SelfSignTimeLock sstl) public returns(uint256){
        vm.prank(caller);
        uint256 cheqId = sstl.writeCheq(dai, amount, escrow, recipient, duration);  // Change dai to arbitrary token
        return cheqId;
    }

    function testTransferCheq(address caller,  uint256 amount, address recipient, uint256 duration, address to) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (
            cheqConditionChecks(caller, amount, recipient, duration, sstl) && 
            cheqConditionChecks(caller, amount, to, duration, sstl) && 
            amount > 0
            ){
            depositHelper(amount, caller);
            uint256 cheqId = writeHelper(caller, amount, amount, recipient, duration, sstl);
            vm.prank(recipient);
            sstl.transferCheq(cheqId, to);
        }
    }

    function testFailTransferCheq(address caller, uint256 amount, address recipient, uint256 duration, address to) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (
            caller == address(0) ||
            to == address(0) ||
            !(amount > 0 && 
            amount <= tokenAllocation && 
            recipient != address(0) && 
            recipient != address(sstl) && 
            recipient != address(this) &&
            duration != 0 &&
            caller == msg.sender)  // don't want the caller to be owner to test non-owner transfer
            ){
            depositHelper(amount, msg.sender);  // msg.sender is writer
            uint256 cheqId = writeHelper(msg.sender, amount, amount, recipient, duration, sstl);
            // Non-owner transfer
            vm.prank(caller);
            sstl.transferCheq(cheqId, to);
            // Transfer of non-existent cheq
            vm.prank(caller);
            sstl.transferCheq(cheqId+1, to);
            vm.prank(msg.sender);
            sstl.transferCheq(cheqId+1, to);
            sstl.transferCheq(cheqId+1, to);
        }
    }

    function testTransferInvoice(address caller, uint256 amount, address recipient, uint256 duration, address to) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (cheqConditionChecks(caller, amount, recipient, duration, sstl) &&
            cheqConditionChecks(caller, amount, to,        duration, sstl)  // Don't transfer "to" smart contract
            ){
            depositHelper(amount, caller);
            uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);
            vm.prank(caller);
            sstl.transferCheq(cheqId, to);
        }
    }
    function cheqConditionChecks(address caller, uint256 amount, address recipient, uint256 duration, SelfSignTimeLock sstl) public view returns(bool){
        return amount <= tokenAllocation && 
               recipient != address(0) && 
               !isContract(caller) &&
               !isContract(recipient) &&
               duration != 0 &&
               duration < type(uint).max &&  // Causes overflow
               (duration >> 2) + (block.timestamp >> 2) <= (type(uint).max >> 2) &&
               caller != address(0);
    }

    function testFailTransferInvoice(address caller, uint256 amount, address recipient, uint256 duration, address to) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (
            caller == address(0) ||
            caller != msg.sender || // msg.sender is invoice owner so they are allowed to transfer
            to == address(0) ||
            !cheqConditionChecks(caller, amount, recipient, duration, sstl)
            ){
            depositHelper(amount, msg.sender);
            uint256 cheqId = writeHelper(msg.sender, amount, 0, recipient, duration, sstl);

            // Non-owner transfer
            vm.prank(caller);
            sstl.transferCheq(cheqId, to);
            // Transfer of non-existent cheq
            sstl.transferCheq(cheqId+1, to);
            vm.prank(caller);
            sstl.transferCheq(cheqId+1, to);
            vm.prank(msg.sender);
            sstl.transferCheq(cheqId+1, to);
        } else {
            require(false, "failed");
        }
    }
    
    function transferHelper(uint256 cheqId, address to, SelfSignTimeLock sstl) public {
        vm.prank(cheq.ownerOf(cheqId));
        sstl.transferCheq(cheqId, to);
    }

    function testFundInvoice(address caller, uint256 amount, address recipient, uint256 duration) public {  //
        SelfSignTimeLock sstl = setUpTimelock();
        if (cheqConditionChecks(caller, amount, recipient, duration, sstl)){
            // TODO why would someone send a zero faceValue cheq?? Perhaps to wrap the NFT with additional information??
            depositHelper(amount, recipient);  // Recipient will be the funder
            uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);
            vm.prank(recipient);  // This can be anybody
            sstl.fundCheq(cheqId, amount);
        }
    }

    function testFailFundInvoice(address caller, uint256 amount, address recipient, uint256 duration, uint256 random) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (cheqConditionChecks(caller, amount, recipient, duration, sstl) && random != 0){
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
        } else {
            require(false, "false");
        }
    }

    function testCashCheq(address caller, uint256 amount, address recipient, uint256 duration) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (cheqConditionChecks(caller, amount, recipient, duration, sstl) && amount != 0){
            // Write cheq from: caller, owner: recipient, to: recipient
            depositHelper(amount, caller);  
            uint256 cheqId = writeHelper(caller, amount, amount, recipient, duration, sstl);
            
            vm.startPrank(recipient);
            vm.warp(block.timestamp + duration);
            sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId));
            vm.stopPrank();
        }
    }
    function testCashInvoice(address caller, uint256 amount, address recipient, uint256 duration) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (cheqConditionChecks(caller, amount, recipient, duration, sstl) &&  // Don't allow recipient to be a contract
            cheqConditionChecks(caller, amount, caller, duration, sstl) &&  // Don't allow owner to be contract
            amount > 0
            ){
            // Write invoice from: caller, owner: caller, to: recipient
            depositHelper(amount, recipient);  
            uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);
            vm.prank(recipient);
            sstl.fundCheq(cheqId, amount);

            vm.startPrank(caller);
            vm.warp(block.timestamp + duration);
            sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId));
            vm.stopPrank();
        }
    }

    function testFailCashCheq(address caller, uint256 amount, address recipient, uint256 duration, uint256 random) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (!cheqConditionChecks(caller, amount, recipient, duration, sstl) && amount > 0){
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
        } else {
            require(false, "bad fuzzing");
        }
    }
    function testFailCashInvoice(address caller, uint256 amount, address recipient, uint256 duration, uint256 random) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (
            !cheqConditionChecks(caller, amount, recipient, duration, sstl) && 
            amount != 0 &&
            recipient != address(0) &&
            caller != recipient  // Sending yourself a cheq allows you to zero cash a cheq
            ){
            depositHelper(amount, recipient);  
            uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);

            // Can't cash unfunded invoice
            // vm.warp(block.timestamp + duration);
            // sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId));  // You can cash an unfunded cheq after inspectionPeriod

            sstl.cashCheq(cheqId, cheq.cheqEscrowed(cheqId)+1);
        } else {
            require(false, "bad fuzzing");
        }
    }
}


    //     // Can't write cheques with no balance
    //     cheq.writeCheq(dai, _amount, duration, auditor, recipient);
    //     // Can't write cheques with insufficient balance
    //     depositHelper(_amount, msg.sender);
    //     cheq.writeCheq(dai, _amount + 1, duration, auditor, recipient);
    //     // Can't write cheques without accepted auditor
    //     cheq.writeCheq(dai, _amount, duration, auditor, recipient);
    //     cheq.acceptAuditor(auditor, true);
    //     // Can't write cheques without auditor handshake
    //     cheq.writeCheq(dai, _amount, duration, auditor, recipient);
    //     vm.prank(auditor);
    //     cheq.acceptUser(msg.sender, true);
    //     // Can't write cheques without recipient approving auditor
    //     cheq.writeCheq(dai, _amount, duration, auditor, recipient);
    //     vm.prank(recipient);
    //     cheq.acceptAuditor(auditor, true);
    //     // Can't write cheques without auditor approving recipient
    //     cheq.writeCheq(dai, _amount, duration, auditor, recipient);
    //     vm.prank(auditor);
    //     cheq.acceptUser(recipient, true);
    //     // Can't write cheques without auditor approved duration
    //     cheq.writeCheq(dai, _amount, duration, auditor, recipient);