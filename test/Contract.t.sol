// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import 'src/dCheque.sol';
import 'src/mock/erc20.sol';

contract ContractTest is Test {
    dCheque public dcheque;
    TestERC20 public dai;
    TestERC20 public usdc;

    function setUp() public { // Test contract has amount in DAI
        dcheque = new dCheque(180);  // trusted account cooldown days
        dai = new TestERC20(100e18, 'DAI', 'DAI'); //
        usdc = new TestERC20(0, 'USDC', 'USDC');
    }
    /*//////////////////////////////////////////////////////////////
                           HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function deposit(uint256 _amount, address _to) public{  
        dai.approve(address(dcheque), _amount);  // msg.sender grants dcheque permission to transfer erc20 to dcheque's address
        assertTrue(dai.balanceOf(address(dcheque))==0);
        dcheque.deposit(dai, _amount, _to);  // dcheque transfers msg.sender's erc20 to dcheque's address and give's it to _to's deposit mapping
        assertTrue(dai.balanceOf(address(dcheque))==_amount);
    }
    function userAuditorUser(address user1, address user2, address auditor, uint256 duration) public {
        uint256 _amount = 10e18;
        // User1 add auditor
        hoax(user1, _amount);
        dcheque.acceptAuditor(auditor);
        // User2 add auditor
        hoax(user2, _amount);
        dcheque.acceptAuditor(auditor);
        // Auditor add user1
        startHoax(auditor, _amount);
        dcheque.acceptUser(user1);
        // Auditor add user2
        dcheque.acceptUser(user2);
        dcheque.setAllowedDuration(duration);
        vm.stopPrank();
    }
    function writeCheque(uint256 _amount, address auditor, address recipient, uint256 duration) public returns (uint256){
        // Set up params and state 
        deposit(_amount, msg.sender);
        userAuditorUser(msg.sender, recipient, auditor, duration);
        vm.prank(msg.sender);
        return dcheque.writeCheque(dai, _amount, duration, auditor, recipient);
    }
    /*//////////////////////////////////////////////////////////////
                           TESTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function testSetProtocolFee(uint256 amount) public {
        // DAI
        assertTrue(dcheque.protocolFee(dai)==0);
        dcheque.setProtocolFee(dai, amount);
        assertTrue(dcheque.protocolFee(dai)==amount);
        // USDC
        assertTrue(dcheque.protocolFee(usdc)==0);
        dcheque.setProtocolFee(usdc, amount);
        assertTrue(dcheque.protocolFee(usdc)==amount);
    }
    function testFailDeposit(uint256 _amount) public { 
        // Can't deposit token where msg.sender has balance=0
        dcheque.deposit(usdc, _amount);
    }
    function testFailDepositTo(uint256 _amount, address _address) public {
        // Can't deposit to user where msg.sender token where user balance=0
        dcheque.deposit(usdc, _amount, _address);
    }
    function testDirectTransfer() public { //address _to
        uint256 _amount = 100e18;
        deposit(_amount, msg.sender);
        assertTrue(dcheque.deposits(msg.sender, dai)==_amount);
        // Transfer deposit to another user
        address _to = address(1);
        vm.prank(msg.sender);
        dcheque.directTransfer(dai, _to, _amount);
        // Transferer doesn't have that amount anymore
        assertTrue(dcheque.deposits(msg.sender, dai)==0);
        // Transferee has that amount now
        assertTrue(dcheque.deposits(_to, dai)==_amount);
    }
    function testFailWriteCheque(uint256 duration) public {
        uint256 _amount = 100e18;
        address auditor = vm.addr(1);
        address recipient =  vm.addr(2);

        // Can't write cheques with no balance
        dcheque.writeCheque(dai, _amount, duration, auditor, recipient);
        // Can't write cheques with insufficient balance
        deposit(_amount, msg.sender);
        dcheque.writeCheque(dai, _amount+1, duration, auditor, recipient);
        // Can't write cheques without accepted auditor
        dcheque.writeCheque(dai, _amount, duration, auditor, recipient);
        dcheque.acceptAuditor(auditor);
        // Can't write cheques without auditor handshake
        dcheque.writeCheque(dai, _amount, duration, auditor, recipient);
        hoax(auditor, _amount);
        dcheque.acceptUser(msg.sender); 
        // Can't write cheques without recipient approving auditor
        dcheque.writeCheque(dai, _amount, duration, auditor, recipient);
        hoax(recipient, _amount);
        dcheque.acceptAuditor(auditor);
        // Can't write cheques without auditor approving recipient
        dcheque.writeCheque(dai, _amount, duration, auditor, recipient);
        hoax(auditor, _amount);
        dcheque.acceptUser(recipient); 
        // Can't write cheques without auditor approved duration
        dcheque.writeCheque(dai, _amount, duration, auditor, recipient);

    }
    function testWriteCheque() public {
        // Set up params and state
        uint256 _amount = 100e18;
        address auditor = vm.addr(1);
        address recipient =  vm.addr(2);
        uint256 duration = 60*60*24*7;
        deposit(_amount, msg.sender);
        userAuditorUser(msg.sender, recipient, auditor, duration);
        assertTrue(dcheque.balanceOf(msg.sender)==0);
        assertTrue(dcheque.balanceOf(recipient)==0);
        // Write cheque
        vm.prank(msg.sender);
        uint256 chequeID = dcheque.writeCheque(dai, _amount, duration, auditor, recipient);
        (uint256 amount,uint256 created,uint256 expiry, IERC20 token,address drawer,address recipient1,address auditor1) = dcheque.chequeInfo(chequeID);
        assertTrue(amount==_amount, "amount");
        assertTrue(created==block.timestamp, "created");
        assertTrue(expiry==block.timestamp+duration, "expired");
        assertTrue(token==dai, "token");
        assertTrue(drawer==msg.sender, "drawer");
        assertTrue(recipient1==recipient, "recipient");
        assertTrue(auditor1==auditor, "auditor");
        assertTrue(dcheque.balanceOf(msg.sender)==0, "drawer balance");
        assertTrue(dcheque.balanceOf(recipient)==1, "recipient");
        assertTrue(dcheque.ownerOf(chequeID)==recipient, "owner");
    }
    function testTransferFrom() public { //address from, address to, uint256 chequeID  //address recipient, address auditor, uint256 duration
        uint256 _amount = 100e18;
        address auditor = vm.addr(1);
        address recipient =  vm.addr(2);
        address degen = vm.addr(3);
        uint256 duration = 60*60*24*7;
        assertTrue(dcheque.balanceOf(recipient)==0);
        uint256 chequeID = writeCheque(_amount, auditor, recipient, duration);  // msg.sender writes this to the recipient
        assertTrue(dcheque.balanceOf(recipient)==1);
        uint256 chequeAmount = dcheque.chequeAmount(chequeID);
        assertTrue(chequeAmount==_amount);

        // transfer cheque to new account
        assertTrue(dcheque.balanceOf(degen)==0);
        uint256 protocolReserve = dcheque.protocolReserve(dai);
        assertTrue(protocolReserve==0);

        vm.prank(recipient);
        dcheque.transferFrom(recipient, degen, chequeID);
        assertTrue(dcheque.balanceOf(recipient)==0);
        assertTrue(dcheque.balanceOf(degen)==1);
        // fee on transfer
        uint256 protocolFee = dcheque.protocolFee(dai);
        chequeAmount = dcheque.chequeAmount(chequeID);
        assertTrue(chequeAmount==_amount-protocolFee);  // cheque worth less
        assertTrue(dcheque.protocolReserve(dai)==protocolFee);  // reserve worth more
    }
    function testSafeTransferFrom() public {
        uint256 _amount = 100e18;
        address auditor = vm.addr(1);
        address recipient =  vm.addr(2);
        address degen = vm.addr(3);
        uint256 duration = 60*60*24*7;
        assertTrue(dcheque.balanceOf(recipient)==0);
        uint256 chequeID = writeCheque(_amount, auditor, recipient, duration);  // msg.sender writes this to the recipient
        assertTrue(dcheque.balanceOf(recipient)==1);
        uint256 chequeAmount = dcheque.chequeAmount(chequeID);
        assertTrue(chequeAmount==_amount);

        // // transfer cheque to new account
        assertTrue(dcheque.balanceOf(degen)==0);
        uint256 protocolReserve = dcheque.protocolReserve(dai);
        assertTrue(protocolReserve==0);
        vm.prank(recipient);
        dcheque.safeTransferFrom(recipient, degen, chequeID);
        assertTrue(dcheque.balanceOf(recipient)==0);
        assertTrue(dcheque.balanceOf(degen)==1);
        // fee on transfer
        uint256 protocolFee = dcheque.protocolFee(dai);
        chequeAmount = dcheque.chequeAmount(chequeID);
        assertTrue(chequeAmount==_amount-protocolFee);
        assertTrue(dcheque.protocolReserve(dai)==protocolFee);
    }
    function testCashCheque() public{
        uint256 _amount = 100e18;
        address auditor = vm.addr(1);
        address recipient =  vm.addr(2);
        uint256 duration = 60*60*24*7;
        uint256 chequeID = writeCheque(_amount, auditor, recipient, duration);

        assertTrue(dcheque.deposits(recipient, dai)==0);
        assertTrue(dai.balanceOf(recipient)==0);

        vm.warp(block.timestamp+duration+1);
        vm.prank(recipient);
        dcheque.cashCheque(chequeID);  // recipient asks dcheque to transfer them the erc20 'locked' in the cheque
        assertTrue(dai.balanceOf(recipient)==_amount);
    }
    // function testTransferCashCheque() public { // the degen cashes the cheque}

    // function testVoidCheque() public {
    //     uint256 _amount = 100e18;
    //     address auditor = vm.addr(1);
    //     address recipient =  vm.addr(2);
    //     uint256 duration = 60*60*24*7;
    //     uint256 chequeID = writeCheque(_amount, auditor, recipient, duration);

    //     assertTrue(dcheque.deposits(recipient, dai)==0);
    //     assertTrue(dai.balanceOf(recipient)==0);

    //     console.log(dcheque.ownerOf(chequeID));
    //     vm.prank(auditor);
    //     dcheque.voidCheque(chequeID);
        // console.log(dcheque.ownerOf(chequeID));
        // assertTrue(dcheque);

        // vm.warp(block.timestamp+duration+1);
        // vm.prank(recipient);
        // dcheque.cashCheque(chequeID);
        // assertTrue(dai.balanceOf(recipient)==_amount);
    // }

    // function testVoidRescueCheque() public {
    //     dcheque.voidRescueCheque(0);
    // }

    // function TestAcceptAuditor() public {
    // }
    // function testAcceptUser() public{
    // }
    // function testSetAllowedDuration() public{
    // }
    // function testGetAcceptedUserAuditors() public{
    // }
    // function testGetAcceptedAuditorUsers() public {
    // }
    // function testSetTrustedAccount() public {
    // }

    // function testFailWithdraw(uint256 _amount) public {  // Withdraw protocol fees to dev account
    //     dcheque.withdraw(dai, _amount);
    //     // dcheque.withdraw(usdc, _amount);
    //     // usdc.approve(address(dcheque), _amount);
    //     // dcheque.withdraw(usdc, _amount);
    // }
    // function testWithdraw(uint256 _amount) public {  // Withdraw protocol fees to dev account
    //     dai.approve(address(dcheque), _amount);
    //     dcheque.deposit(dai, _amount);
    //     dcheque.withdraw(dai, _amount);
    // }
}
