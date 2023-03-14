// // SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import "./mock/erc20.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";
import {CheqRegistrar} from "src/contracts/CheqRegistrar.sol";
import {DataTypes} from "src/contracts/libraries/DataTypes.sol";
import {Milestones} from "src/contracts/modules/Milestones.sol";

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
        REGISTRAR.whitelistModule(module, false, true); // Whitelist bytecode
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
        REGISTRAR.whitelistToken(daiAddress, true);
        assertTrue(
            REGISTRAR.tokenWhitelisted(daiAddress),
            "Whitelisting failed"
        );
        REGISTRAR.whitelistToken(daiAddress, false);
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
        REGISTRAR.whitelistModule(milestonesAddress, true, false); // whitelist bytecode, not address
        (addressWhitelisted, bytecodeWhitelisted) = REGISTRAR.moduleWhitelisted(
            milestonesAddress
        );
        assertTrue(
            addressWhitelisted || bytecodeWhitelisted,
            "Whitelisting failed"
        );
        REGISTRAR.whitelistModule(milestonesAddress, false, false);
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
        REGISTRAR.whitelistModule(address(milestones), true, false);
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

    function registrarWriteBefore(address caller, address recipient) public {
        assertTrue(
            REGISTRAR.balanceOf(caller) == 0,
            "Caller already had a cheq"
        );
        assertTrue(
            REGISTRAR.balanceOf(recipient) == 0,
            "Recipient already had a cheq"
        );
        assertTrue(REGISTRAR.totalSupply() == 0, "Cheq supply non-zero");
    }

    function registrarWriteAfter(
        uint256 cheqId,
        uint256 amount,
        uint256 escrowed,
        address owner,
        address drawer,
        address recipient,
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

    function testWritePay(
        address debtor,
        uint256 directAmount,
        address creditor
    ) public {
        vm.assume(directAmount != 0 && directAmount <= tokensCreated);
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
            (uint256 writeFeeBPS, , , ) = REGISTRAR.getFees();
            (uint256 moduleWriteFeeBPS, , , ) = milestones.getFees();
            uint256 registrarFee = calcFee(writeFeeBPS, directAmount);
            console.log("RegistrarFee: ", registrarFee);
            uint256 moduleFee = calcFee(moduleWriteFeeBPS, directAmount);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = directAmount + registrarFee + moduleFee;
            console.log(directAmount, "-->", totalWithFees);
        }

        REGISTRAR.whitelistToken(address(dai), true);
        vm.prank(debtor);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(debtor, totalWithFees);
        vm.assume(dai.balanceOf(debtor) >= totalWithFees);

        registrarWriteBefore(debtor, creditor);
        /**
        (
            address dappOperator,
            bytes32 docHash,
            uint256[] memory milestonePrices
        ) = abi.decode(initData, (address, bytes32, uint256[]));
         */
        bytes memory initData = abi.encode(
            creditor, // ToNotify
            directAmount,
            block.timestamp,
            address(this), // dappOperator
            bytes32(keccak256("this is a hash"))
        );

        vm.prank(debtor);
        uint256 cheqId = REGISTRAR.write(
            address(dai),
            0,
            directAmount,
            creditor, // Owner
            address(milestones),
            initData
        );
        registrarWriteAfter(
            cheqId,
            directAmount,
            0,
            creditor, // Owner
            debtor, // Drawer
            creditor, // Recipient
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
            (uint256 writeFeeBPS, , , ) = REGISTRAR.getFees();
            (uint256 moduleWriteFeeBPS, , , ) = milestones.getFees();
            uint256 registrarFee = calcFee(writeFeeBPS, 0);
            console.log("RegistrarFee: ", registrarFee);
            uint256 moduleFee = calcFee(moduleWriteFeeBPS, 0);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = 0 + registrarFee + moduleFee;
            console.log(0, "-->", totalWithFees);
        }

        REGISTRAR.whitelistToken(address(dai), true);
        vm.prank(debtor);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(debtor, totalWithFees);
        vm.assume(dai.balanceOf(debtor) >= totalWithFees);

        registrarWriteBefore(debtor, creditor);
        bytes memory initData = abi.encode(
            debtor,
            amount,
            block.timestamp,
            creditor,
            bytes32(keccak256("this is a hash"))
        );

        vm.prank(creditor);
        uint256 cheqId = REGISTRAR.write(
            address(dai),
            0,
            0,
            creditor,
            address(milestones),
            initData
        ); // Sets caller as owner
        registrarWriteAfter(
            cheqId,
            amount,
            0,
            creditor, // Owner
            creditor, // Drawer
            debtor, // Recipient
            address(milestones)
        );

        // ICheqModule wrote correctly to it's storage
        string memory tokenURI = REGISTRAR.tokenURI(cheqId);
        console.log("TokenURI: ");
        console.log(tokenURI);
    }

    function calcTotalFees(
        CheqRegistrar registrar,
        Milestones milestones,
        uint256 escrowed,
        uint256 directAmount
    ) public view returns (uint256) {
        (uint256 writeFeeBPS, , , ) = registrar.getFees();
        (uint256 moduleWriteFeeBPS, , , ) = milestones.getFees();
        uint256 registrarFee = calcFee(writeFeeBPS, directAmount + escrowed);
        console.log("RegistrarFee: ", registrarFee);
        uint256 moduleFee = calcFee(moduleWriteFeeBPS, directAmount + escrowed);
        console.log("ModuleFee: ", moduleFee);
        uint256 totalWithFees = escrowed +
            directAmount +
            registrarFee +
            moduleFee;
        console.log(directAmount, "-->", totalWithFees);
        return totalWithFees;
    }

    function writeHelper(
        address caller,
        uint256 amount,
        uint256 escrowed,
        uint256 directAmount,
        address drawer,
        address recipient,
        address owner
    ) public returns (uint256, Milestones) {
        Milestones milestones = setUpMilestones();

        uint256 totalWithFees = calcTotalFees(
            REGISTRAR,
            milestones,
            escrowed,
            directAmount
        );
        REGISTRAR.whitelistToken(address(dai), true);
        vm.prank(caller);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(caller, totalWithFees);
        vm.assume(dai.balanceOf(caller) >= totalWithFees);

        registrarWriteBefore(caller, recipient);

        bytes memory initData = abi.encode(
            recipient,
            amount,
            block.timestamp,
            caller,
            bytes32(keccak256("this is a hash"))
        );

        console.log(amount, directAmount, totalWithFees);
        vm.prank(caller);
        uint256 cheqId = REGISTRAR.write(
            address(dai),
            escrowed,
            directAmount,
            owner,
            address(milestones),
            initData
        ); // Sets caller as owner
        registrarWriteAfter(
            cheqId,
            amount,
            0,
            owner,
            drawer,
            recipient,
            address(milestones)
        );
        return (cheqId, milestones);
    }

    function testFundInvoice(
        address caller,
        uint256 faceValue,
        address recipient
    ) public {
        vm.assume(faceValue != 0 && faceValue <= tokensCreated);
        vm.assume(caller != recipient);
        vm.assume(caller != address(0));
        vm.assume(
            caller != address(0) &&
                recipient != address(0) &&
                !isContract(caller)
        );

        (uint256 cheqId, Milestones milestones) = writeHelper(
            caller, // Who the caller should be
            faceValue, // Face value of invoice
            0, // escrowed amount
            0, // instant amount
            caller, // The drawer
            recipient,
            caller // The owner
        );

        /// Fund cheq
        uint256 totalWithFees = calcTotalFees(
            REGISTRAR,
            milestones,
            0, // escrowed amount
            faceValue // instant amount
        );
        vm.prank(recipient);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(recipient, totalWithFees);
        vm.assume(dai.balanceOf(recipient) >= totalWithFees);

        vm.prank(recipient);
        REGISTRAR.fund(
            cheqId,
            0, // Escrow amount
            faceValue, // Instant amount
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
