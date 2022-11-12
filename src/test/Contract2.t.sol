// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "src/contracts/CheqV2.sol";
import "./mock/erc20.sol";

contract ContractTest is Test {
    CRX public cheq;
    TestERC20 public dai;
    TestERC20 public usdc;

    function setUp() public { 
        cheq = new CRX(); 
        SelfSignTimeLock selfSignedTL = new SelfSignTimeLock(cheq);
        HandshakeTimeLock handshakeTL = new HandshakeTimeLock(cheq);

        // Make sure whitelisting works
        // Make sure non-whitelisted brokers/users don't work
        cheq.whitelistBroker(selfSignedTL, true);
        cheq.whitelistBroker(handshakeTL, true);
        dai = new TestERC20(10000e18, "DAI", "DAI"); //
        usdc = new TestERC20(0, "USDC", "USDC");
    }

    /*//////////////////////////////////////////////////////////////
                           SELF-SIGNED TESTING
    //////////////////////////////////////////////////////////////*/


    function testWrite() public {
    }
    function testTransfer() public {
    }
    function testFund() public {
    }
    function testCash() public {
    }
    function testApprove() public {
    }
    function testDeposit() public {
    }

    /*//////////////////////////////////////////////////////////////
                           AUDITOR TESTING
    //////////////////////////////////////////////////////////////*/



    /*//////////////////////////////////////////////////////////////
                           HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function depositHelper(uint256 _amount, address _to) public {
        dai.approve(address(cheq), _amount); // msg.sender grants cheq permission to transfer erc20 to cheq's address
        assertTrue(dai.balanceOf(address(cheq)) == 0);
        cheq.deposit(dai, _amount, _to); // cheq transfers msg.sender's erc20 to cheq's address and give's it to _to's deposit mapping
        assertTrue(dai.balanceOf(address(cheq)) == _amount);
    }
    function writeChequeHelper(
        uint256 _amount,
        address auditor,
        address recipient
    ) public returns (uint256) {
        depositHelper(_amount, msg.sender);
        
        assertTrue(cheq.balanceOf(recipient) == 0);
        vm.prank(address(selfSignedTL));
        uint256 chequeID = cheq.write(
            dai,
            _amount,
            recipient,
            msg.sender
        );
        assertTrue(cheq.deposits(msg.sender, dai) == 0); // writing cheque should reduce balance
        assertTrue(cheq.balanceOf(recipient) == 1); // recipient cheque balance increased
        assertTrue(cheq.ownerOf(chequeID) == recipient); // recipient owns cheque
        return chequeID;
    }
    /*//////////////////////////////////////////////////////////////
                           TESTING FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    // function testSetProtocolFee(uint256 amount) public {
    //     // DAI
    //     assertTrue(cheq.protocolFee(dai) == 0);
    //     cheq.setProtocolFee(dai, amount);
    //     assertTrue(cheq.protocolFee(dai) == amount);
    //     // USDC
    //     assertTrue(cheq.protocolFee(usdc) == 0);
    //     cheq.setProtocolFee(usdc, amount);
    //     assertTrue(cheq.protocolFee(usdc) == amount);
    // }
    // function testFailDeposit(uint256 _amount) public {
    //     // Can't deposit token where msg.sender has balance=0
    //     cheq.deposit(usdc, _amount);
    // }
    // function testFailDepositTo(uint256 _amount, address _address) public {
    //     // Can't deposit to user where msg.sender token where user balance=0
    //     cheq.deposit(usdc, _amount, _address);
    // }
    // function testFailWriteCheque(uint256 duration) public {
    //     // TODO add failure when writing cheq right after adding the auditor
    //     uint256 _amount = 100e18;
    //     address auditor = vm.addr(1);
    //     address recipient = vm.addr(2);

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
    // function testTransferFrom() public {
    //     uint256 _amount = 100e18;
    //     address auditor = vm.addr(1);
    //     address recipient = vm.addr(2);
    //     address degen = vm.addr(3);
    //     uint256 duration = 60 * 60 * 24 * 7;
    //     assertTrue(cheq.balanceOf(recipient) == 0);
    //     uint256 chequeID = writeChequeHelper(
    //         _amount,
    //         auditor,
    //         recipient,
    //         duration
    //     ); // msg.sender writes this to the recipient
    //     assertTrue(cheq.balanceOf(recipient) == 1);
    //     uint256 chequeAmount = cheq.chequeAmount(chequeID);
    //     assertTrue(chequeAmount == _amount);

    //     // transfer cheque to new account
    //     assertTrue(cheq.balanceOf(degen) == 0);
    //     uint256 protocolReserve = cheq.protocolReserve(dai);
    //     assertTrue(protocolReserve == 0);

    //     vm.prank(recipient);
    //     cheq.transferFrom(recipient, degen, chequeID);
    //     assertTrue(cheq.balanceOf(recipient) == 0);
    //     assertTrue(cheq.balanceOf(degen) == 1);
    //     // fee on transfer
    //     uint256 protocolFee = cheq.protocolFee(dai);
    //     chequeAmount = cheq.chequeAmount(chequeID);
    //     assertTrue(chequeAmount == _amount - protocolFee); // cheque worth less
    //     assertTrue(cheq.protocolReserve(dai) == protocolFee); // reserve worth more
    // }
    // function testSafeTransferFrom() public {
    //     uint256 _amount = 100e18;
    //     address auditor = vm.addr(1);
    //     address recipient = vm.addr(2);
    //     address degen = vm.addr(3);
    //     uint256 duration = 60 * 60 * 24 * 7;
    //     assertTrue(cheq.balanceOf(recipient) == 0);
    //     uint256 chequeID = writeChequeHelper(
    //         _amount,
    //         auditor,
    //         recipient,
    //         duration
    //     ); // msg.sender writes this to the recipient
    //     assertTrue(cheq.balanceOf(recipient) == 1);
    //     uint256 chequeAmount = cheq.chequeAmount(chequeID);
    //     assertTrue(chequeAmount == _amount);

    //     // // transfer cheque to new account
    //     assertTrue(cheq.balanceOf(degen) == 0);
    //     uint256 protocolReserve = cheq.protocolReserve(dai);
    //     assertTrue(protocolReserve == 0);
    //     vm.prank(recipient);
    //     cheq.safeTransferFrom(recipient, degen, chequeID);
    //     assertTrue(cheq.balanceOf(recipient) == 0);
    //     assertTrue(cheq.balanceOf(degen) == 1);
    //     // fee on transfer
    //     uint256 protocolFee = cheq.protocolFee(dai);
    //     chequeAmount = cheq.chequeAmount(chequeID);
    //     assertTrue(chequeAmount == _amount - protocolFee);
    //     assertTrue(cheq.protocolReserve(dai) == protocolFee);
    // }
    // function testCashCheque() public {
    //     uint256 _amount = 100e18;
    //     address auditor = vm.addr(1);
    //     address recipient = vm.addr(2);
    //     uint256 duration = 60 * 60 * 24 * 7;
    //     uint256 chequeID = writeChequeHelper(
    //         _amount,
    //         auditor,
    //         recipient,
    //         duration
    //     ); // Deposits, handshakes, and writes cheque

    //     assertTrue(cheq.deposits(recipient, dai) == 0);
    //     assertTrue(dai.balanceOf(recipient) == 0);

    //     vm.warp(block.timestamp + duration + 1);
    //     vm.prank(recipient);
    //     cheq.cashCheque(chequeID); // recipient asks cheq to transfer them the erc20 'locked' in the cheque
    //     assertTrue(dai.balanceOf(recipient) == _amount);
    // }
    // function testTransferCashCheque() public {
    //     // the degen cashes the cheque
    //     uint256 _amount = 100e18;
    //     address auditor = vm.addr(1);
    //     address recipient = vm.addr(2);
    //     address degen = vm.addr(3);
    //     uint256 duration = 60 * 60 * 24 * 7;
    //     uint256 chequeID = writeChequeHelper(
    //         _amount,
    //         auditor,
    //         recipient,
    //         duration
    //     ); // msg.sender writes this to the recipient

    //     // Transfer cheque to degen account
    //     assertTrue(cheq.balanceOf(degen) == 0); // degen owns no cheques
    //     assertTrue(cheq.protocolReserve(dai) == 0); // protocol fee has not been taken
    //     // Transfer
    //     uint256 chequeAmount = cheq.chequeAmount(chequeID);
    //     assertTrue(chequeAmount == _amount);
    //     vm.prank(recipient);
    //     cheq.transferFrom(recipient, degen, chequeID); // owner (recipient) asks Cheq to transfer to degen
    //     assertTrue(cheq.balanceOf(recipient) == 0);
    //     assertTrue(cheq.balanceOf(degen) == 1);
    //     // Fee on transfer
    //     uint256 protocolFee = cheq.protocolFee(dai);
    //     chequeAmount = cheq.chequeAmount(chequeID);
    //     assertTrue(chequeAmount == _amount - protocolFee); // cheque worth less
    //     assertTrue(cheq.protocolReserve(dai) == protocolFee); // reserve worth more

    //     // Degen cashing
    //     assertTrue(cheq.deposits(degen, dai) == 0);
    //     assertTrue(dai.balanceOf(degen) == 0);
    //     vm.warp(block.timestamp + duration + 1);
    //     vm.prank(degen);
    //     cheq.cashCheque(chequeID); // degen asks cheq to transfer them the erc20 'locked' in the cheque
    //     assertTrue(dai.balanceOf(degen) == _amount);
    // }
    // function testVoidCheque() public {
    //     uint256 _amount = 100e18;
    //     address auditor = vm.addr(1);
    //     address recipient = vm.addr(2);
    //     uint256 duration = 60 * 60 * 24 * 7;
    //     uint256 chequeID = writeChequeHelper(
    //         _amount,
    //         auditor,
    //         recipient,
    //         duration
    //     );
    //     voidChequeHelper(msg.sender, auditor, chequeID, recipient);

    //     // Ensure cheque can't be cashed
    //     vm.warp(block.timestamp + duration + 1);
    //     vm.prank(recipient);
    //     assertTrue(dai.balanceOf(recipient) == 0);
    //     vm.expectRevert("ERC721: invalid token ID");
    //     cheq.cashCheque(chequeID); // recipient asks cheq to transfer them the erc20 'locked' in the cheque
    //     assertTrue(dai.balanceOf(recipient) == 0);

    //     // Ensure cheque can't be transfered
    //     vm.prank(recipient);
    //     vm.expectRevert("ERC721: invalid token ID");
    //     cheq.transferFrom(recipient, msg.sender, chequeID);
    // }
    // function testAcceptUser(address auditor, address user) public {
    //     vm.prank(auditor);
    //     cheq.acceptUser(user, true);
    // }
    // function testAcceptAuditor(address user, address auditor) public {
    //     vm.prank(user);
    //     cheq.acceptAuditor(auditor, true);
    // }
    // function testFailWithdraw(uint256 _amount) public {
    //     // Withdraw protocol fees to dev account
    //     testTransferFrom(); // deposits, hadshakes, writes, transfers

    //     uint256 daiReserve = cheq.protocolReserve(dai);
    //     if (_amount > daiReserve) {
    //         // withdrawing more than unused collateral reserve allows
    //         cheq.withdraw(dai, _amount);
    //     } else {
    //         // Non-owner withdrawing funds
    //         vm.prank(msg.sender);
    //         cheq.withdraw(dai, _amount);
    //     }
    // }
    // function testWithdraw() public {
    //     // Withdraw protocol fees to dev account
    //     testTransferFrom(); // deposits, hadshakes, writes, transfers
    //     assertTrue(dai.balanceOf(msg.sender) == 0);
    //     uint256 daiReserve = cheq.protocolReserve(dai);
    //     assertTrue(dai.balanceOf(address(this)) == 0);
    //     cheq.withdraw(dai, daiReserve);
    //     assertTrue(dai.balanceOf(address(this)) == daiReserve);
    // }
    // function voidChequeHelper(
    //     address drawer,
    //     address auditor,
    //     uint256 chequeID,
    //     address owner
    // ) public {
    //     uint256 drawerDeposit = cheq.deposits(drawer, dai); // Drawers deposit amount
    //     assertTrue(cheq.balanceOf(owner) == 1); // recipient owns cheque
    //     vm.prank(auditor);
    //     cheq.voidCheque(chequeID); // Auditor calls voidCheque
    //     assertTrue(cheq.balanceOf(owner) == 0); // recipient owns 1 less cheque
    //     assertTrue(
    //         cheq.deposits(drawer, dai) ==
    //             drawerDeposit + cheq.chequeAmount(chequeID)
    //     ); // drawer's collateral is returned
    //     drawerDeposit = cheq.deposits(drawer, dai); // Drawers deposit amount
    //     vm.expectRevert("ERC721: invalid token ID");
    //     cheq.ownerOf(chequeID); // FAILS SINCE _burn() REMOVES OWNERSHIP
    // }
}
