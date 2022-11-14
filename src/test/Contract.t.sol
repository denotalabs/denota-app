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
        if (caller!=address(this)){
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
        if (
            !(amount > 0 && 
            amount <= tokenAllocation && 
            recipient != address(0) && 
            recipient != address(sstl) && 
            recipient != address(this) &&
            recipient != address(cheq) &&
            duration != 0)){
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
        }
    }

    function writeHelper(address caller, uint256 amount, uint256 escrow, address recipient, uint256 duration, SelfSignTimeLock sstl) public returns(uint256){
        vm.prank(caller);
        uint256 cheqId = sstl.writeCheq(dai, amount, escrow, recipient, duration);
        return cheqId;
    }

    function testTransferCheq(address caller,  uint256 amount, address recipient, uint256 duration, address to) public {
        SelfSignTimeLock sstl = setUpTimelock();
        if (
            caller != address(0) &&
            to != address(0) &&
            amount > 0 && 
            amount <= tokenAllocation && 
            recipient != address(0) && 
            recipient != address(sstl) && 
            recipient != address(this) &&
            recipient != address(cheq) &&
            duration > 0
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
        if (
            caller != address(0) &&
            amount > 0 && 
            amount <= tokenAllocation && 
            recipient != address(0) && 
            recipient != address(sstl) && 
            recipient != address(this) &&
            duration != 0
            ){
            depositHelper(amount, caller);
            uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);
            vm.prank(caller);
            sstl.transferCheq(cheqId, to);
        }
    }

    function testFailTransferInvoice(address caller, uint256 amount, address recipient, uint256 duration, address to) public {
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
            caller == msg.sender)  // dont want caller to be owner (msg.sender)
            ){
            depositHelper(amount, msg.sender);
            uint256 cheqId = writeHelper(msg.sender, amount, 0, recipient, duration, sstl);
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
    
    function transferHelper(uint256 cheqId, address to, SelfSignTimeLock sstl) public {
        vm.prank(cheq.ownerOf(cheqId));
        sstl.transferCheq(cheqId, to);
    }

    function testFundInvoice(address caller, uint256 amount, address recipient, uint256 duration) public {  //
        SelfSignTimeLock sstl = setUpTimelock();
        if (amount > 0 && 
            amount <= tokenAllocation && 
            recipient != address(0) && 
            recipient != address(sstl) && 
            recipient != address(this) &&
            duration != 0 &&
            caller != address(0)  // callers become the owners of an invoice
            ){
            console.log("Before", cheq.deposits(recipient, dai));
            depositHelper(amount, recipient);  // Recipient will be the funder
            console.log("After",cheq.deposits(recipient, dai));
            uint256 cheqId = writeHelper(caller, amount, 0, recipient, duration, sstl);
            vm.prank(recipient);  // This can be anybody
            sstl.fundCheq(cheqId, amount);
        }
    }

    // function testFailFundInvoice() public {  
    //     // not invoice
    //     // invoice but not correct amount?
    // }

    // function testCash() public {

    // }
    // function testFailCash() public {

    // }

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









// pragma solidity ^0.8.13;

// import "forge-std/Test.sol";
// import "forge-std/console.sol";
// import "src/contracts/Cheq.sol";
// import "./mock/erc20.sol";

// contract ContractTest is Test {
//     Cheq public cheq;
//     TestERC20 public dai;
//     TestERC20 public usdc;

//     function setUp() public {
//         // Test contract has amount in DAI
//         cheq = new Cheq(); // trusted account cooldown seconds
//         dai = new TestERC20(100e18, "DAI", "DAI"); //
//         usdc = new TestERC20(0, "USDC", "USDC");
//     }

//     /*//////////////////////////////////////////////////////////////
//                            HELPER FUNCTIONS
//     //////////////////////////////////////////////////////////////*/
    // function depositHelper(uint256 _amount, address _to) public {
    //     dai.approve(address(cheq), _amount); // msg.sender grants cheq permission to transfer erc20 to cheq's address
    //     assertTrue(dai.balanceOf(address(cheq)) == 0);
    //     cheq.deposit(dai, _amount, _to); // cheq transfers msg.sender's erc20 to cheq's address and give's it to _to's deposit mapping
    //     assertTrue(dai.balanceOf(address(cheq)) == _amount);
    // }

//     function setupAuditorForTransaction(
//         address user1,
//         address user2,
//         address auditor,
//         uint256 duration
//     ) public {
//         vm.prank(user1);
//         cheq.acceptAuditor(auditor, true);
//         vm.prank(user2);
//         cheq.acceptAuditor(auditor, true);
//         vm.startPrank(auditor);
//         cheq.acceptUser(user1, true);
//         cheq.acceptUser(user2, true);
//         // cheq.setAllowedDuration(duration);
//         vm.stopPrank();
//         vm.warp(block.timestamp + 24 hours + 100);
//     }

    // function writeChequeHelper(
    //     uint256 _amount,
    //     address auditor,
    //     address recipient,
    //     uint256 duration
    // ) public returns (uint256) {
    //     // Set up params and state
    //     depositHelper(_amount, msg.sender);
    //     setupAuditorForTransaction(msg.sender, recipient, auditor, duration); // Drawer-Auditor-Recipient all accept
    //     assertTrue(cheq.balanceOf(recipient) == 0); // writing cheque should reduce balance
    //     assertTrue(
    //         block.timestamp >=
    //             cheq.acceptedAuditorTimestamp(msg.sender, auditor) + 24 hours
    //     ); // auditor waiting period has passed
    //     vm.prank(msg.sender);
    //     uint256 chequeID = cheq.writeCheque(
    //         dai,
    //         _amount,
    //         duration,
    //         auditor,
    //         recipient
    //     );
    //     assertTrue(cheq.deposits(msg.sender, dai) == 0); // writing cheque should reduce balance
    //     assertTrue(cheq.balanceOf(recipient) == 1); // recipient cheque balance increased
    //     assertTrue(cheq.ownerOf(chequeID) == recipient); // recipient owns cheque
    //     return chequeID;
    // }

//     function voidChequeHelper(
//         address drawer,
//         address auditor,
//         uint256 chequeID,
//         address owner
//     ) public {
//         uint256 drawerDeposit = cheq.deposits(drawer, dai); // Drawers deposit amount
//         assertTrue(cheq.balanceOf(owner) == 1); // recipient owns cheque
//         vm.prank(auditor);
//         cheq.voidCheque(chequeID); // Auditor calls voidCheque
//         assertTrue(cheq.balanceOf(owner) == 0); // recipient owns 1 less cheque
//         assertTrue(
//             cheq.deposits(drawer, dai) ==
//                 drawerDeposit + cheq.chequeAmount(chequeID)
//         ); // drawer's collateral is returned
//         drawerDeposit = cheq.deposits(drawer, dai); // Drawers deposit amount
//         vm.expectRevert("ERC721: invalid token ID");
//         cheq.ownerOf(chequeID); // FAILS SINCE _burn() REMOVES OWNERSHIP
//     }

//     function transferCheque() public {}

//     /*//////////////////////////////////////////////////////////////
//                            TESTING FUNCTIONS
//     //////////////////////////////////////////////////////////////*/
//     function testSetProtocolFee(uint256 amount) public {
//         // DAI
//         assertTrue(cheq.protocolFee(dai) == 0);
//         cheq.setProtocolFee(dai, amount);
//         assertTrue(cheq.protocolFee(dai) == amount);
//         // USDC
//         assertTrue(cheq.protocolFee(usdc) == 0);
//         cheq.setProtocolFee(usdc, amount);
//         assertTrue(cheq.protocolFee(usdc) == amount);
//     }

//     function testFailDeposit(uint256 _amount) public {
//         // Can't deposit token where msg.sender has balance=0
//         cheq.deposit(usdc, _amount);
//     }

//     function testFailDepositTo(uint256 _amount, address _address) public {
//         // Can't deposit to user where msg.sender token where user balance=0
//         cheq.deposit(usdc, _amount, _address);
//     }

//     // function testDirectTransfer() public {
//     //     //address _to
//     //     uint256 _amount = 100e18;
//     //     depositHelper(_amount, msg.sender);
//     //     assertTrue(cheq.deposits(msg.sender, dai) == _amount);
//     //     // Transfer deposit to another user
//     //     address _to = address(1);
//     //     vm.prank(msg.sender);
//     //     cheq.directTransfer(dai, _to, _amount);
//     //     // Transferer doesn't have that amount anymore
//     //     assertTrue(cheq.deposits(msg.sender, dai) == 0);
//     //     // Transferee has that amount now
//     //     assertTrue(cheq.deposits(_to, dai) == _amount);
//     // }

    //     // Can't write cheques with no balance
    //     cheq.writeCheque(dai, _amount, duration, auditor, recipient);
    //     // Can't write cheques with insufficient balance
    //     depositHelper(_amount, msg.sender);
    //     cheq.writeCheque(dai, _amount + 1, duration, auditor, recipient);
    //     // Can't write cheques without accepted auditor
    //     cheq.writeCheque(dai, _amount, duration, auditor, recipient);
    //     cheq.acceptAuditor(auditor, true);
    //     // Can't write cheques without auditor handshake
    //     cheq.writeCheque(dai, _amount, duration, auditor, recipient);
    //     vm.prank(auditor);
    //     cheq.acceptUser(msg.sender, true);
    //     // Can't write cheques without recipient approving auditor
    //     cheq.writeCheque(dai, _amount, duration, auditor, recipient);
    //     vm.prank(recipient);
    //     cheq.acceptAuditor(auditor, true);
    //     // Can't write cheques without auditor approving recipient
    //     cheq.writeCheque(dai, _amount, duration, auditor, recipient);
    //     vm.prank(auditor);
    //     cheq.acceptUser(recipient, true);
    //     // Can't write cheques without auditor approved duration
    //     cheq.writeCheque(dai, _amount, duration, auditor, recipient);
    // }
    // function testWriteCheque() public {
    //     // Set up params and state
    //     uint256 _amount = 100e18;
    //     address auditor = vm.addr(1);
    //     address recipient = vm.addr(2);
    //     uint256 duration = 60 * 60 * 24 * 7;
    //     depositHelper(_amount, msg.sender);
    //     setupAuditorForTransaction(msg.sender, recipient, auditor, duration);
    //     assertTrue(cheq.balanceOf(msg.sender) == 0);
    //     assertTrue(cheq.balanceOf(recipient) == 0);
    //     // Write cheque
    //     vm.prank(msg.sender);
    //     uint256 chequeID = cheq.writeCheque(
    //         dai,
    //         _amount,
    //         duration,
    //         auditor,
    //         recipient
    //     );

    //     (   uint256 amount,
    //         uint256 created,
    //         uint256 expiry,
    //         IERC20 token,
    //         address drawer,
    //         address recipient1,
    //         address auditor1,
    //         Cheq.Status status
    //     ) = cheq.chequeInfo(chequeID);
    //     assertTrue(amount == _amount, "amount");
    //     assertTrue(created == block.timestamp, "created");
    //     assertTrue(expiry == block.timestamp + duration, "expired");
    //     assertTrue(token == dai, "token");
    //     assertTrue(drawer == msg.sender, "drawer");
    //     assertTrue(recipient1 == recipient, "recipient");
    //     assertTrue(auditor1 == auditor, "auditor");
    //     assertTrue(status == Cheq.Status(0), "cheq not pending");
    //     assertTrue(cheq.balanceOf(msg.sender) == 0, "drawer balance");
    //     assertTrue(cheq.balanceOf(recipient) == 1, "recipient");
    //     assertTrue(cheq.ownerOf(chequeID) == recipient, "owner");
    // }

//     function testTransferFrom() public {
//         uint256 _amount = 100e18;
//         address auditor = vm.addr(1);
//         address recipient = vm.addr(2);
//         address degen = vm.addr(3);
//         uint256 duration = 60 * 60 * 24 * 7;
//         assertTrue(cheq.balanceOf(recipient) == 0);
//         uint256 chequeID = writeChequeHelper(
//             _amount,
//             auditor,
//             recipient,
//             duration
//         ); // msg.sender writes this to the recipient
//         assertTrue(cheq.balanceOf(recipient) == 1);
//         uint256 chequeAmount = cheq.chequeAmount(chequeID);
//         assertTrue(chequeAmount == _amount);

//         // transfer cheque to new account
//         assertTrue(cheq.balanceOf(degen) == 0);
//         uint256 protocolReserve = cheq.protocolReserve(dai);
//         assertTrue(protocolReserve == 0);

//         vm.prank(recipient);
//         cheq.transferFrom(recipient, degen, chequeID);
//         assertTrue(cheq.balanceOf(recipient) == 0);
//         assertTrue(cheq.balanceOf(degen) == 1);
//         // fee on transfer
//         uint256 protocolFee = cheq.protocolFee(dai);
//         chequeAmount = cheq.chequeAmount(chequeID);
//         assertTrue(chequeAmount == _amount - protocolFee); // cheque worth less
//         assertTrue(cheq.protocolReserve(dai) == protocolFee); // reserve worth more
//     }

//     function testSafeTransferFrom() public {
//         uint256 _amount = 100e18;
//         address auditor = vm.addr(1);
//         address recipient = vm.addr(2);
//         address degen = vm.addr(3);
//         uint256 duration = 60 * 60 * 24 * 7;
//         assertTrue(cheq.balanceOf(recipient) == 0);
//         uint256 chequeID = writeChequeHelper(
//             _amount,
//             auditor,
//             recipient,
//             duration
//         ); // msg.sender writes this to the recipient
//         assertTrue(cheq.balanceOf(recipient) == 1);
//         uint256 chequeAmount = cheq.chequeAmount(chequeID);
//         assertTrue(chequeAmount == _amount);

//         // // transfer cheque to new account
//         assertTrue(cheq.balanceOf(degen) == 0);
//         uint256 protocolReserve = cheq.protocolReserve(dai);
//         assertTrue(protocolReserve == 0);
//         vm.prank(recipient);
//         cheq.safeTransferFrom(recipient, degen, chequeID);
//         assertTrue(cheq.balanceOf(recipient) == 0);
//         assertTrue(cheq.balanceOf(degen) == 1);
//         // fee on transfer
//         uint256 protocolFee = cheq.protocolFee(dai);
//         chequeAmount = cheq.chequeAmount(chequeID);
//         assertTrue(chequeAmount == _amount - protocolFee);
//         assertTrue(cheq.protocolReserve(dai) == protocolFee);
//     }

//     function testCashCheque() public {
//         uint256 _amount = 100e18;
//         address auditor = vm.addr(1);
//         address recipient = vm.addr(2);
//         uint256 duration = 60 * 60 * 24 * 7;
//         uint256 chequeID = writeChequeHelper(
//             _amount,
//             auditor,
//             recipient,
//             duration
//         ); // Deposits, handshakes, and writes cheque

//         assertTrue(cheq.deposits(recipient, dai) == 0);
//         assertTrue(dai.balanceOf(recipient) == 0);

//         vm.warp(block.timestamp + duration + 1);
//         vm.prank(recipient);
//         cheq.cashCheque(chequeID); // recipient asks cheq to transfer them the erc20 'locked' in the cheque
//         assertTrue(dai.balanceOf(recipient) == _amount);
//     }

//     function testTransferCashCheque() public {
//         // the degen cashes the cheque
//         uint256 _amount = 100e18;
//         address auditor = vm.addr(1);
//         address recipient = vm.addr(2);
//         address degen = vm.addr(3);
//         uint256 duration = 60 * 60 * 24 * 7;
//         uint256 chequeID = writeChequeHelper(
//             _amount,
//             auditor,
//             recipient,
//             duration
//         ); // msg.sender writes this to the recipient

//         // Transfer cheque to degen account
//         assertTrue(cheq.balanceOf(degen) == 0); // degen owns no cheques
//         assertTrue(cheq.protocolReserve(dai) == 0); // protocol fee has not been taken
//         // Transfer
//         uint256 chequeAmount = cheq.chequeAmount(chequeID);
//         assertTrue(chequeAmount == _amount);
//         vm.prank(recipient);
//         cheq.transferFrom(recipient, degen, chequeID); // owner (recipient) asks Cheq to transfer to degen
//         assertTrue(cheq.balanceOf(recipient) == 0);
//         assertTrue(cheq.balanceOf(degen) == 1);
//         // Fee on transfer
//         uint256 protocolFee = cheq.protocolFee(dai);
//         chequeAmount = cheq.chequeAmount(chequeID);
//         assertTrue(chequeAmount == _amount - protocolFee); // cheque worth less
//         assertTrue(cheq.protocolReserve(dai) == protocolFee); // reserve worth more

//         // Degen cashing
//         assertTrue(cheq.deposits(degen, dai) == 0);
//         assertTrue(dai.balanceOf(degen) == 0);
//         vm.warp(block.timestamp + duration + 1);
//         vm.prank(degen);
//         cheq.cashCheque(chequeID); // degen asks cheq to transfer them the erc20 'locked' in the cheque
//         assertTrue(dai.balanceOf(degen) == _amount);
//     }

//     function testVoidCheque() public {
//         uint256 _amount = 100e18;
//         address auditor = vm.addr(1);
//         address recipient = vm.addr(2);
//         uint256 duration = 60 * 60 * 24 * 7;
//         uint256 chequeID = writeChequeHelper(
//             _amount,
//             auditor,
//             recipient,
//             duration
//         );
//         voidChequeHelper(msg.sender, auditor, chequeID, recipient);

//         // Ensure cheque can't be cashed
//         vm.warp(block.timestamp + duration + 1);
//         vm.prank(recipient);
//         assertTrue(dai.balanceOf(recipient) == 0);
//         vm.expectRevert("ERC721: invalid token ID");
//         cheq.cashCheque(chequeID); // recipient asks cheq to transfer them the erc20 'locked' in the cheque
//         assertTrue(dai.balanceOf(recipient) == 0);

//         // Ensure cheque can't be transfered
//         vm.prank(recipient);
//         vm.expectRevert("ERC721: invalid token ID");
//         cheq.transferFrom(recipient, msg.sender, chequeID);
//     }

//     // function testVoidRescueCheque() public {
//     //     uint256 _amount = 100e18;
//     //     address auditor = vm.addr(1);
//     //     address recipient = vm.addr(2);
//     //     address trusted = vm.addr(3);
//     //     uint256 duration = 60 * 60 * 24 * 7 + cheq.trustedAccountCooldown();

//     //     // Set drawer's trusted account
//     //     vm.warp(block.timestamp + cheq.trustedAccountCooldown() + 1);
//     //     vm.prank(msg.sender);
//     //     cheq.setTrustedAccount(trusted);

//     //     uint256 chequeID = writeChequeHelper(
//     //         _amount,
//     //         auditor,
//     //         recipient,
//     //         duration
//     //     );

//     //     // Void cheque
//     //     assertTrue(cheq.deposits(trusted, dai) == 0);
//     //     assertTrue(cheq.balanceOf(recipient) == 1); // recipient owns cheque
//     //     vm.prank(auditor);
//     //     cheq.voidRescueCheque(chequeID); // Auditor calls voidCheque
//     //     assertTrue(cheq.balanceOf(recipient) == 0, "recipient has balance of"); // recipient owns 1 less cheque
//     //     vm.expectRevert("ERC721: invalid token ID");
//     //     cheq.ownerOf(chequeID);
//     //     // Trusted account gets deposit
//     //     assertTrue(
//     //         cheq.deposits(trusted, dai) == _amount,
//     //         "trusted didn't get collateral"
//     //     );
//     // }

//     // function testSetTrustedAccount(address trusted) public {
//     //     vm.warp(block.timestamp + cheq.trustedAccountCooldown() + 1);
//     //     vm.prank(msg.sender);
//     //     cheq.setTrustedAccount(trusted);
//     // }

//     function testAcceptUser(address auditor, address user) public {
//         vm.prank(auditor);
//         cheq.acceptUser(user, true);
//     }

//     function testAcceptAuditor(address user, address auditor) public {
//         vm.prank(user);
//         cheq.acceptAuditor(auditor, true);
//     }

//     // function testSetAllowedDuration(address auditor, uint256 duration) public {
//     //     vm.prank(auditor);
//     //     cheq.setAllowedDuration(duration);
//     // }

//     // function testGetAccepted() public {  // This is being hardcoded for now
//     //     address auditor = vm.addr(1);
//     //     address recipient = vm.addr(2);
//     //     uint256 duration = 60 * 60 * 24 * 7;
//     //     setupAuditorForTransaction(msg.sender, recipient, auditor, duration);
//     //     address[] memory auditorsUsers = cheq.getAcceptedAuditorUsers(auditor, true);
//     //     assertTrue(auditorsUsers.length == 2);
//     //     assertTrue(auditorsUsers[0] == msg.sender);
//     //     assertTrue(auditorsUsers[1] == recipient);

//     //     address[] memory userAuditors = cheq.getAcceptedUserAuditors(
//     //         msg.sender
//     //     );
//     //     assertTrue(userAuditors.length == 1);
//     //     assertTrue(userAuditors[0] == auditor);
//     // }

//     function testFailWithdraw(uint256 _amount) public {
//         // Withdraw protocol fees to dev account
//         testTransferFrom(); // deposits, hadshakes, writes, transfers

//         uint256 daiReserve = cheq.protocolReserve(dai);
//         if (_amount > daiReserve) {
//             // withdrawing more than unused collateral reserve allows
//             cheq.withdraw(dai, _amount);
//         } else {
//             // Non-owner withdrawing funds
//             vm.prank(msg.sender);
//             cheq.withdraw(dai, _amount);
//         }
//     }

//     function testWithdraw() public {
//         // Withdraw protocol fees to dev account
//         testTransferFrom(); // deposits, hadshakes, writes, transfers
//         assertTrue(dai.balanceOf(msg.sender) == 0);
//         uint256 daiReserve = cheq.protocolReserve(dai);
//         assertTrue(dai.balanceOf(address(this)) == 0);
//         cheq.withdraw(dai, daiReserve);
//         assertTrue(dai.balanceOf(address(this)) == daiReserve);
//     }
//     // NEED TO ADD depositWrite() test
// }