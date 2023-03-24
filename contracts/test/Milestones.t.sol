// // SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import "./mock/erc20.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";
import {CheqRegistrar} from "../src/CheqRegistrar.sol";
import {DataTypes} from "../src/libraries/DataTypes.sol";
import {Milestones} from "../src/modules/Milestones.sol";

// TODO add fail tests
contract MilestonesTest is Test {
    CheqRegistrar public REGISTRAR;
    TestERC20 public dai;
    TestERC20 public usdc;
    uint256 public immutable tokensCreated = 1_000_000_000_000e18;

    function isContract(address _addr) public view returns (bool) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }

    function setUp() public {
        // sets up the registrar and ERC20s
        REGISTRAR = new CheqRegistrar(); // ContractTest is the owner
        dai = new TestERC20(tokensCreated, "DAI", "DAI"); // Sends ContractTest the dai
        usdc = new TestERC20(0, "USDC", "USDC");
        // REGISTRAR.whitelistToken(address(dai), true);
        // REGISTRAR.whitelistToken(address(usdc), true);

        vm.label(msg.sender, "Alice");
        vm.label(address(this), "TestContract");
        vm.label(address(dai), "TestDai");
        vm.label(address(usdc), "TestUSDC");
        vm.label(address(REGISTRAR), "CheqRegistrarContract");
    }

    function whitelist(address module) public {
        // Whitelists tokens, rules, modules
        // REGISTRAR.whitelistRule(rule, true);
        REGISTRAR.whitelistModule(module, false, true, "Milestones"); // Whitelist bytecode
    }

    /*//////////////////////////////////////////////////////////////
                            WHITELIST TESTS
    //////////////////////////////////////////////////////////////*/
    function testWhitelistToken() public {
        address daiAddress = address(dai);
        vm.prank(address(this));

        // Whitelist tokens
        assertFalse(
            REGISTRAR.tokenWhitelisted(daiAddress),
            "Unauthorized whitelist"
        );
        REGISTRAR.whitelistToken(daiAddress, true, "DAI");
        assertTrue(
            REGISTRAR.tokenWhitelisted(daiAddress),
            "Whitelisting failed"
        );
        REGISTRAR.whitelistToken(daiAddress, false, "DAI");
        assertFalse(
            REGISTRAR.tokenWhitelisted(daiAddress),
            "Un-whitelisting failed"
        );

        // Whitelist rules
        // MilestonesRules milestonesRules = new MilestonesRules();
        // address milestonesRulesAddress = address(milestonesRules);
        // assertFalse(
        //     REGISTRAR.ruleWhitelisted(milestonesRulesAddress),
        //     "Unauthorized whitelist"
        // );
        // REGISTRAR.whitelistRule(milestonesRulesAddress, true); // whitelist bytecode, not address
        // assertTrue(
        //     REGISTRAR.ruleWhitelisted(milestonesRulesAddress),
        //     "Whitelisting failed"
        // );
        // REGISTRAR.whitelistRule(milestonesRulesAddress, false);
        // assertFalse(
        //     REGISTRAR.ruleWhitelisted(milestonesRulesAddress),
        //     "Un-whitelisting failed"
        // );
        // REGISTRAR.whitelistRule(milestonesRulesAddress, true); // whitelist bytecode, not address

        // Whitelist module
        Milestones milestones = new Milestones(
            address(REGISTRAR),
            DataTypes.WTFCFees(0, 0, 0, 0),
            "ipfs://yourmemos.com/"
        );
        address milestonesAddress = address(milestones);
        (bool addressWhitelisted, bool bytecodeWhitelisted) = REGISTRAR
            .moduleWhitelisted(milestonesAddress);
        assertFalse(
            addressWhitelisted || bytecodeWhitelisted,
            "Unauthorized whitelist"
        );
        REGISTRAR.whitelistModule(milestonesAddress, true, false, "Milestones"); // whitelist bytecode, not address
        (addressWhitelisted, bytecodeWhitelisted) = REGISTRAR.moduleWhitelisted(
            milestonesAddress
        );
        assertTrue(
            addressWhitelisted || bytecodeWhitelisted,
            "Whitelisting failed"
        );
        REGISTRAR.whitelistModule(
            milestonesAddress,
            false,
            false,
            "Milestones"
        );
        (addressWhitelisted, bytecodeWhitelisted) = REGISTRAR.moduleWhitelisted(
            milestonesAddress
        );
        assertFalse(
            addressWhitelisted || bytecodeWhitelisted,
            "Un-whitelisting failed"
        );
    }

    // function testFailWhitelist(address caller) public {
    //     vm.assume(caller == address(0));  // Deployer can whitelist, test others accounts
    //     Marketplace market = new Marketplace(REGISTRAR);
    //     vm.prank(caller);
    //     REGISTRAR.whitelistModule(market, true);
    //     assertFalse(REGISTRAR.moduleWhitelisted(address(this), market), "Unauthorized whitelist");
    // }

    function setUpMilestones() public returns (Milestones) {
        // Deploy and whitelist module
        Milestones milestones = new Milestones(
            address(REGISTRAR),
            DataTypes.WTFCFees(0, 0, 0, 0),
            "ipfs://yourmemos.com/"
        );
        REGISTRAR.whitelistModule(
            address(milestones),
            true,
            false,
            "Milestones"
        );
        vm.label(address(milestones), "Milestones");
        return milestones;
    }

    /*//////////////////////////////////////////////////////////////
                            MODULE TESTS
    //////////////////////////////////////////////////////////////*/
    function calcFee(
        uint256 fee,
        uint256 amount
    ) public pure returns (uint256) {
        return (amount * fee) / 10_000;
    }

    function cheqWriteCondition(
        address caller,
        uint256 amount,
        uint256 escrowed,
        address drawer,
        address recipient,
        address owner
    ) public view returns (bool) {
        return
            (amount != 0) && // Cheq must have a face value
            (drawer != recipient) && // Drawer and recipient aren't the same
            (owner == drawer || owner == recipient) && // Either drawer or recipient must be owner
            (caller == drawer || caller == recipient) && // Delegated pay/requesting not allowed
            (escrowed == 0 || escrowed == amount) && // Either send unfunded or fully funded cheq
            (recipient != address(0) &&
                owner != address(0) &&
                drawer != address(0)) &&
            // Testing conditions
            (amount <= tokensCreated) && // Can't use more token than created
            (caller != address(0)) && // Don't vm.prank from address(0)
            !isContract(owner); // Don't send cheqs to non-ERC721Reciever contracts
    }

    function registrarWriteBefore(address caller, address owner) public {
        assertTrue(
            REGISTRAR.balanceOf(caller) == 0,
            "Caller already had a cheq"
        );
        assertTrue(
            REGISTRAR.balanceOf(owner) == 0,
            "Recipient already had a cheq"
        );
        assertTrue(REGISTRAR.totalSupply() == 0, "Cheq supply non-zero");
    }

    function registrarWriteAfter(
        uint256 cheqId,
        uint256 escrowed,
        address owner,
        address module
    ) public {
        assertTrue(
            REGISTRAR.totalSupply() == 1,
            "Cheq supply didn't increment"
        );
        assertTrue(
            REGISTRAR.ownerOf(cheqId) == owner,
            "`owner` isn't owner of cheq"
        );
        assertTrue(
            REGISTRAR.balanceOf(owner) == 1,
            "Owner balance didn't increment"
        );

        // CheqRegistrar wrote correctly to its storage
        // assertTrue(REGISTRAR.cheqDrawer(cheqId) == drawer, "Incorrect drawer");
        // assertTrue(
        //     REGISTRAR.cheqRecipient(cheqId) == recipient,
        //     "Incorrect recipient"
        // );
        assertTrue(
            REGISTRAR.cheqCurrency(cheqId) == address(dai),
            "Incorrect token"
        );
        // assertTrue(REGISTRAR.cheqAmount(cheqId) == amount, "Incorrect amount");
        assertTrue(
            REGISTRAR.cheqEscrowed(cheqId) == escrowed,
            "Incorrect escrow"
        );
        assertTrue(
            address(REGISTRAR.cheqModule(cheqId)) == module,
            "Incorrect module"
        );
    }

    function calcTotalFees(
        CheqRegistrar registrar,
        Milestones milestones,
        uint256 escrowed,
        uint256 directAmount
    ) public view returns (uint256) {
        // (uint256 writeFeeBPS, , , ) = registrar.getFees();
        DataTypes.WTFCFees memory fees = milestones.getFees(address(0));
        // uint256 registrarFee = calcFee(writeFeeBPS, directAmount + escrowed);
        // console.log("RegistrarFee: ", registrarFee);
        uint256 moduleFee = calcFee(fees.writeBPS, directAmount + escrowed);
        console.log("ModuleFee: ", moduleFee);
        uint256 totalWithFees = escrowed +
            directAmount +
            // registrarFee +
            moduleFee;
        console.log(directAmount, "-->", totalWithFees);
        return totalWithFees;
    }

    function writeHelper(
        address caller,
        uint256 escrowed,
        uint256 directAmount,
        address toNotify,
        address owner
    ) public returns (uint256, Milestones) {
        Milestones milestones = setUpMilestones();

        uint256 totalWithFees = calcTotalFees(
            REGISTRAR,
            milestones,
            escrowed,
            directAmount
        );
        REGISTRAR.whitelistToken(address(dai), true, "Milestones");
        vm.prank(caller);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(caller, totalWithFees);
        vm.assume(dai.balanceOf(caller) >= totalWithFees);

        registrarWriteBefore(caller, toNotify);

        uint256[] memory milestoneAmounts = new uint256[](3);
        milestoneAmounts[0] = 10;
        milestoneAmounts[1] = 10;
        milestoneAmounts[2] = 10;
        bytes memory initData = abi.encode(
            toNotify,
            address(this),
            bytes32(keccak256("this is a hash")),
            milestoneAmounts
        );

        console.log(directAmount, totalWithFees);
        vm.prank(caller);
        uint256 cheqId = REGISTRAR.write(
            address(dai),
            escrowed,
            directAmount,
            owner,
            address(milestones),
            initData
        ); // Sets caller as owner
        registrarWriteAfter(cheqId, 0, owner, address(milestones));
        return (cheqId, milestones);
    }

    function testWritePay(
        address debtor,
        // uint256 directAmount,
        address creditor
    ) public {
        uint256 firstMilestone = 10;
        vm.assume(firstMilestone != 0 && firstMilestone <= tokensCreated);
        address owner = creditor;
        vm.assume(
            debtor != address(0) &&
                creditor != address(0) &&
                !isContract(creditor)
        );
        vm.assume(debtor != creditor);

        Milestones milestones = setUpMilestones();
        uint256 totalWithFees;
        {
            DataTypes.WTFCFees memory fees = milestones.getFees(address(0));
            uint256 moduleFee = calcFee(fees.writeBPS, firstMilestone);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = firstMilestone + moduleFee;
            console.log(firstMilestone, "-->", totalWithFees);
        }

        REGISTRAR.whitelistToken(address(dai), true, "Milestones");
        vm.prank(debtor);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(debtor, totalWithFees);
        vm.assume(dai.balanceOf(debtor) >= totalWithFees);

        registrarWriteBefore(debtor, creditor);

        uint256[] memory milestoneAmounts = new uint256[](3);
        milestoneAmounts[0] = 10;
        milestoneAmounts[1] = 10;
        milestoneAmounts[2] = 10;
        bytes memory initData = abi.encode(
            creditor,
            address(this),
            bytes32(keccak256("this is a hash")),
            milestoneAmounts
        );
        vm.prank(debtor);
        uint256 cheqId = REGISTRAR.write(
            address(dai), // currency
            firstMilestone, // escrowed
            0, // instant
            creditor, // Owner
            address(milestones), // module
            initData // module data
        );
        registrarWriteAfter(
            cheqId,
            firstMilestone,
            creditor, // Owner
            address(milestones)
        );

        // ICheqModule wrote correctly to it's storage
        string memory tokenURI = REGISTRAR.tokenURI(cheqId);
        console.log("TokenURI: ");
        console.log(tokenURI);
    }

    function testWriteInvoice(
        address debtor,
        uint256 amount,
        address creditor
    ) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        address owner = creditor;
        vm.assume(
            debtor != address(0) &&
                creditor != address(0) &&
                !isContract(creditor)
        );
        vm.assume(debtor != creditor);

        Milestones milestones = setUpMilestones();
        uint256 totalWithFees;
        {
            DataTypes.WTFCFees memory fees = milestones.getFees(address(0));
            uint256 moduleFee = calcFee(fees.writeBPS, 0);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = 0 + moduleFee;
            console.log(0, "-->", totalWithFees);
        }

        REGISTRAR.whitelistToken(address(dai), true, "Milestones");
        vm.prank(debtor);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(debtor, totalWithFees);
        vm.assume(dai.balanceOf(debtor) >= totalWithFees);

        registrarWriteBefore(debtor, creditor);
        uint256[] memory milestoneAmounts = new uint256[](3);
        milestoneAmounts[0] = 10;
        milestoneAmounts[1] = 10;
        milestoneAmounts[2] = 10;
        bytes memory initData = abi.encode(
            debtor, // toNotify
            address(this), // dappOperator
            bytes32(keccak256("this is a hash")), // documentHash
            milestoneAmounts // milestones
        );
        vm.prank(creditor);
        uint256 cheqId = REGISTRAR.write(
            address(dai), // currency
            0, // escrowed
            0, // instant
            creditor, // owner
            address(milestones), // module
            initData // module data
        ); // Sets caller as owner
        registrarWriteAfter(
            cheqId,
            0, // escrowed
            creditor, // Owner
            address(milestones)
        );

        // ICheqModule wrote correctly to it's storage
        string memory tokenURI = REGISTRAR.tokenURI(cheqId);
        console.log("TokenURI: ");
        console.log(tokenURI);
    }

    function testFundInvoice(
        address creditor,
        // uint256 faceValue,  // Need a dynamic way of escrowing first milestone amount
        address toNotify
    ) public {
        uint256 firstMilestone = 10;
        vm.assume(firstMilestone != 0 && firstMilestone <= tokensCreated);
        vm.assume(creditor != toNotify);
        vm.assume(creditor != address(0));
        vm.assume(
            creditor != address(0) &&
                toNotify != address(0) &&
                !isContract(creditor)
        );
        // First milestone must be escrowed (or instant and second escrowed)
        (uint256 cheqId, Milestones milestones) = writeHelper(
            creditor, // caller
            0, // escrowed amount
            0, // instant amount
            toNotify, // debtor in this case
            creditor // The owner
        );

        /// Fund cheq
        uint256 totalWithFees = calcTotalFees(
            REGISTRAR,
            milestones,
            0, // escrowed amount
            firstMilestone // instant amount
        );
        vm.prank(toNotify);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(toNotify, totalWithFees);
        vm.assume(dai.balanceOf(toNotify) >= totalWithFees);

        vm.prank(toNotify);
        REGISTRAR.fund(
            cheqId,
            10, // Escrow amount  // TODO dynamic
            0, // Instant amount
            abi.encode(bytes32("")) // Fund data
        );
    }
    // uint256 cheqId,
    // uint256 amount,
    // uint256 directAmount,
    // bytes calldata fundData
    // function testCashPay(address caller, uint256 amount, address drawer, address recipient) public {
    //     vm.assume(amount != 0 && amount <= tokensCreated);
    //     (address drawer, uint256 escrowed, address owner) = (caller, amount, caller);
    //     vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
    //     vm.assume(drawer != recipient);

    //     (uint256 cheqId, ) = writeHelper(caller, amount, escrowed, drawer, recipient, owner);
    //     bytes memory cashData =  abi.encode(bytes32(""));

    //     vm.prank(owner);
    //     REGISTRAR.cash(cheqId, escrowed, owner, cashData);
    // }

    // function fundHelper(uint256 cheqId, address funder, uint256 amount, Milestones milestones) public {
    //     bytes memory fundData =  abi.encode(bytes32(""));

    //     uint256 totalWithFees;
    //     {
    //         ( , , uint256 fundFeeBPS, ) = REGISTRAR.getFees();
    //         ( , , uint256 moduleFeeBPS, ) = milestones.getFees();
    //         uint256 registrarFee = calcFee(fundFeeBPS, amount);
    //         console.log("RegistrarFee: ", registrarFee);
    //         uint256 moduleFee = calcFee(moduleFeeBPS, amount);
    //         console.log("ModuleFee: ", moduleFee);
    //         totalWithFees = amount + registrarFee + moduleFee;
    //         console.log(amount, "-->", totalWithFees);
    //     }

    //     vm.prank(funder);
    //     dai.approve(address(REGISTRAR), totalWithFees);  // Need to get the fee amounts beforehand
    //     dai.transfer(funder, totalWithFees);

    //     vm.prank(funder);
    //     REGISTRAR.fund(cheqId, 0, amount, fundData);  // Send direct amount
    // }

    // function testCashInvoice(address caller, uint256 amount, address drawer, address recipient) public {
    //     vm.assume(amount != 0 && amount <= tokensCreated);
    //     (address drawer, uint256 escrowed, address owner) = (caller, 0, caller);
    //     vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
    //     vm.assume(drawer != recipient);

    //     (uint256 cheqId, Milestones milestones) = writeHelper(caller, amount, escrowed, drawer, recipient, owner);

    //     fundHelper(cheqId, recipient, amount, milestones);

    //     bytes memory cashData =  abi.encode(bytes32(""));
    //     vm.prank(owner);
    //     REGISTRAR.cash(cheqId, amount, owner, cashData);
    // }
}

// function testTransferPay(address caller, uint256 amount, address recipient) public {
//     vm.assume(amount != 0 && amount <= tokensCreated);
//     (address drawer, uint256 directAmount, address owner) = (caller, amount, recipient);
//     vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
//     vm.assume(drawer != recipient);

//     (uint256 cheqId, Milestones milestones) = writeHelper(caller, amount, directAmount, drawer, recipient, owner);
//     vm.expectRevert(bytes("Rule: Disallowed"));
//     REGISTRAR.transferFrom(owner, drawer, cheqId);
// }

// function testTransferInvoice(address caller, uint256 amount, address recipient) public {
//     vm.assume(amount != 0 && amount <= tokensCreated);
//     (address drawer, uint256 directAmount, address owner) = (caller, amount, caller);
//     vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
//     vm.assume(drawer != recipient);

//     (uint256 cheqId, Milestones milestones) = writeHelper(caller, amount, directAmount, drawer, recipient, owner);
//     vm.expectRevert(bytes("Rule: Disallowed"));
//     REGISTRAR.transferFrom(owner, drawer, cheqId);
// }

// function testFundPay(address caller, uint256 amount, address drawer, address recipient) public {
//     vm.assume(amount != 0 && amount <= tokensCreated);
//     (address drawer, uint256 escrowed, address owner) = (caller, amount, caller);
//     vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
//     vm.assume(drawer != recipient);

//     (uint256 cheqId, Milestones milestones) = writeHelper(caller, amount, escrowed, drawer, recipient, owner);
//     bytes memory fundData =  abi.encode(bytes32(""));

//     vm.expectRevert(bytes("Rule: Only recipient"));
//     REGISTRAR.fund(cheqId, 0, amount, fundData);
// }
