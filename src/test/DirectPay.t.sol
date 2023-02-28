// // SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import "./mock/erc20.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";
import {CheqRegistrar} from "src/contracts/CheqRegistrar.sol";
import {DataTypes} from "src/contracts/libraries/DataTypes.sol";
import {DirectPay} from "src/contracts/modules/DirectPay.sol";
import {DirectPayRules} from "src/contracts/rules/DirectPayRules.sol";

// TODO add fail tests
contract DirectPayTest is Test {
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
        REGISTRAR = new CheqRegistrar(DataTypes.WTFCFees(0, 0, 0, 0)); // ContractTest is the owner
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

    function whitelist(address rule, address module) public {
        // Whitelists tokens, rules, modules
        REGISTRAR.whitelistRule(rule, true);
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
        DirectPayRules directPayRules = new DirectPayRules();
        address directPayRulesAddress = address(directPayRules);
        assertFalse(
            REGISTRAR.ruleWhitelisted(directPayRulesAddress),
            "Unauthorized whitelist"
        );
        REGISTRAR.whitelistRule(directPayRulesAddress, true); // whitelist bytecode, not address
        assertTrue(
            REGISTRAR.ruleWhitelisted(directPayRulesAddress),
            "Whitelisting failed"
        );
        REGISTRAR.whitelistRule(directPayRulesAddress, false);
        assertFalse(
            REGISTRAR.ruleWhitelisted(directPayRulesAddress),
            "Un-whitelisting failed"
        );
        REGISTRAR.whitelistRule(directPayRulesAddress, true); // whitelist bytecode, not address

        // Whitelist module
        DirectPay directPay = new DirectPay(
            address(REGISTRAR),
            directPayRulesAddress,
            directPayRulesAddress,
            directPayRulesAddress,
            directPayRulesAddress,
            directPayRulesAddress,
            DataTypes.WTFCFees(0, 0, 0, 0),
            "ipfs://yourmemos.com/"
        );
        address directPayAddress = address(directPay);
        (bool addressWhitelisted, bool bytecodeWhitelisted) = REGISTRAR
            .moduleWhitelisted(directPayAddress);
        assertFalse(
            addressWhitelisted || bytecodeWhitelisted,
            "Unauthorized whitelist"
        );
        REGISTRAR.whitelistModule(directPayAddress, true, false); // whitelist bytecode, not address
        (addressWhitelisted, bytecodeWhitelisted) = REGISTRAR.moduleWhitelisted(
            directPayAddress
        );
        assertTrue(
            addressWhitelisted || bytecodeWhitelisted,
            "Whitelisting failed"
        );
        REGISTRAR.whitelistModule(directPayAddress, false, false);
        (addressWhitelisted, bytecodeWhitelisted) = REGISTRAR.moduleWhitelisted(
            directPayAddress
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

    function setUpDirectPay() public returns (DirectPay) {
        // Deploy and whitelist module
        DirectPayRules directPayRules = new DirectPayRules();

        address directPayRulesAddress = address(directPayRules);

        REGISTRAR.whitelistRule(directPayRulesAddress, true);

        DirectPay directPay = new DirectPay(
            address(REGISTRAR),
            directPayRulesAddress,
            directPayRulesAddress,
            directPayRulesAddress,
            directPayRulesAddress,
            directPayRulesAddress,
            DataTypes.WTFCFees(0, 0, 0, 0),
            "ipfs://yourmemos.com/"
        );
        REGISTRAR.whitelistModule(address(directPay), true, false);
        vm.label(address(directPay), "DirectPay");
        return directPay;
    }

    /*//////////////////////////////////////////////////////////////
                            MODULE TESTS
    //////////////////////////////////////////////////////////////*/
    function calcFee(uint256 fee, uint256 amount)
        public
        pure
        returns (uint256)
    {
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
        // escrow==amount && drawer==caller && recipient==owner
        address caller,
        uint256 amount,
        address recipient
    ) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 directAmount, address owner) = (
            caller,
            amount,
            recipient
        );
        vm.assume(
            caller != address(0) &&
                recipient != address(0) &&
                !isContract(owner)
        );
        vm.assume(drawer != recipient);

        DirectPay directPay = setUpDirectPay();
        uint256 totalWithFees;
        {
            (uint256 writeFeeBPS, , , ) = REGISTRAR.getFees();
            (uint256 moduleWriteFeeBPS, , , ) = directPay.getFees();
            uint256 registrarFee = calcFee(writeFeeBPS, directAmount);
            console.log("RegistrarFee: ", registrarFee);
            uint256 moduleFee = calcFee(moduleWriteFeeBPS, directAmount);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = directAmount + registrarFee + moduleFee;
            console.log(directAmount, "-->", totalWithFees);
        }

        REGISTRAR.whitelistToken(address(dai), true);
        vm.prank(caller);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(caller, totalWithFees);
        vm.assume(dai.balanceOf(caller) >= totalWithFees);

        registrarWriteBefore(caller, recipient);
        bytes memory initData = abi.encode(
            bytes32(keccak256("this is a hash")),
            caller
        );

        vm.prank(caller);
        uint256 cheqId = REGISTRAR.write(
            address(dai),
            0,
            directAmount,
            owner,
            address(directPay),
            initData
        ); // Sets caller as owner
        registrarWriteAfter(
            cheqId,
            amount,
            0,
            owner,
            drawer,
            recipient,
            address(directPay)
        );

        // ICheqModule wrote correctly to it's storage
        string memory tokenURI = REGISTRAR.tokenURI(cheqId);
        console.log("TokenURI: ");
        console.log(tokenURI);
    }

    function testWriteInvoice(
        // escrow==0 && drawer==caller && drawer==owner
        address caller,
        uint256 amount,
        address recipient
    ) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 directAmount, address owner) = (
            caller,
            amount,
            caller
        );
        vm.assume(
            caller != address(0) &&
                recipient != address(0) &&
                !isContract(owner)
        );
        vm.assume(drawer != recipient);

        DirectPay directPay = setUpDirectPay();
        uint256 totalWithFees;
        {
            (uint256 writeFeeBPS, , , ) = REGISTRAR.getFees();
            (uint256 moduleWriteFeeBPS, , , ) = directPay.getFees();
            uint256 registrarFee = calcFee(writeFeeBPS, directAmount);
            console.log("RegistrarFee: ", registrarFee);
            uint256 moduleFee = calcFee(moduleWriteFeeBPS, directAmount);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = directAmount + registrarFee + moduleFee;
            console.log(directAmount, "-->", totalWithFees);
        }

        REGISTRAR.whitelistToken(address(dai), true);
        vm.prank(caller);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(caller, totalWithFees);
        vm.assume(dai.balanceOf(caller) >= totalWithFees);

        registrarWriteBefore(caller, recipient);
        bytes memory initData = abi.encode(
            bytes32(keccak256("this is another hash")),
            caller
        );

        vm.prank(caller);
        uint256 cheqId = REGISTRAR.write(
            address(dai),
            0,
            directAmount,
            owner,
            address(directPay),
            initData
        ); // Sets caller as owner
        registrarWriteAfter(
            cheqId,
            amount,
            0,
            owner,
            drawer,
            recipient,
            address(directPay)
        );

        // ICheqModule wrote correctly to it's storage
        string memory tokenURI = REGISTRAR.tokenURI(cheqId);
        console.log("TokenURI: ");
        console.log(tokenURI);
    }

    function calcTotalFees(
        CheqRegistrar registrar,
        DirectPay directPay,
        uint256 escrowed,
        uint256 directAmount
    ) public returns (uint256) {
        (uint256 writeFeeBPS, , , ) = registrar.getFees();
        (uint256 moduleWriteFeeBPS, , , ) = directPay.getFees();
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
    ) public returns (uint256, DirectPay) {
        DirectPay directPay = setUpDirectPay();

        uint256 totalWithFees = calcTotalFees(
            REGISTRAR,
            directPay,
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
            bytes32(keccak256("this is a hash")),
            caller
        );

        console.log(amount, directAmount, totalWithFees);
        vm.prank(caller);
        uint256 cheqId = REGISTRAR.write(
            address(dai),
            escrowed,
            directAmount,
            owner,
            address(directPay),
            initData
        ); // Sets caller as owner
        registrarWriteAfter(
            cheqId,
            amount,
            0,
            owner,
            drawer,
            recipient,
            address(directPay)
        );
        return (cheqId, directPay);
    }

    // function testTransferPay(address caller, uint256 amount, address recipient) public {
    //     vm.assume(amount != 0 && amount <= tokensCreated);
    //     (address drawer, uint256 directAmount, address owner) = (caller, amount, recipient);
    //     vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
    //     vm.assume(drawer != recipient);

    //     (uint256 cheqId, DirectPay directPay) = writeHelper(caller, amount, directAmount, drawer, recipient, owner);
    //     vm.expectRevert(bytes("Rule: Disallowed"));
    //     REGISTRAR.transferFrom(owner, drawer, cheqId);
    // }

    // function testTransferInvoice(address caller, uint256 amount, address recipient) public {
    //     vm.assume(amount != 0 && amount <= tokensCreated);
    //     (address drawer, uint256 directAmount, address owner) = (caller, amount, caller);
    //     vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
    //     vm.assume(drawer != recipient);

    //     (uint256 cheqId, DirectPay directPay) = writeHelper(caller, amount, directAmount, drawer, recipient, owner);
    //     vm.expectRevert(bytes("Rule: Disallowed"));
    //     REGISTRAR.transferFrom(owner, drawer, cheqId);
    // }

    // function testFundPay(address caller, uint256 amount, address drawer, address recipient) public {
    //     vm.assume(amount != 0 && amount <= tokensCreated);
    //     (address drawer, uint256 escrowed, address owner) = (caller, amount, caller);
    //     vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
    //     vm.assume(drawer != recipient);

    //     (uint256 cheqId, DirectPay directPay) = writeHelper(caller, amount, escrowed, drawer, recipient, owner);
    //     bytes memory fundData =  abi.encode(bytes32(""));

    //     vm.expectRevert(bytes("Rule: Only recipient"));
    //     REGISTRAR.fund(cheqId, 0, amount, fundData);
    // }

    function testFundInvoice(
        address caller,
        uint256 amount,
        address drawer,
        address recipient
    ) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (
            address drawer,
            uint256 escrowed,
            uint256 directAmount,
            address owner
        ) = (caller, 0, amount, caller);
        vm.assume(
            caller != address(0) &&
                recipient != address(0) &&
                !isContract(owner)
        );
        vm.assume(drawer != recipient);

        (uint256 cheqId, DirectPay directPay) = writeHelper(
            caller,
            amount,
            escrowed,
            directAmount,
            drawer,
            recipient,
            owner
        );
        bytes memory fundData = abi.encode(bytes32(""));

        uint256 totalWithFees = calcTotalFees(
            REGISTRAR,
            directPay,
            escrowed,
            directAmount
        );
        vm.prank(recipient);
        dai.approve(address(REGISTRAR), totalWithFees); // Need to get the fee amounts beforehand
        dai.transfer(recipient, totalWithFees);
        // vm.assume(dai.balanceOf(caller) >= totalWithFees);

        vm.prank(recipient);
        REGISTRAR.fund(cheqId, 0, totalWithFees, fundData);
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

    // function fundHelper(uint256 cheqId, address funder, uint256 amount, DirectPay directPay) public {
    //     bytes memory fundData =  abi.encode(bytes32(""));

    //     uint256 totalWithFees;
    //     {
    //         ( , , uint256 fundFeeBPS, ) = REGISTRAR.getFees();
    //         ( , , uint256 moduleFeeBPS, ) = directPay.getFees();
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

    //     (uint256 cheqId, DirectPay directPay) = writeHelper(caller, amount, escrowed, drawer, recipient, owner);

    //     fundHelper(cheqId, recipient, amount, directPay);

    //     bytes memory cashData =  abi.encode(bytes32(""));
    //     vm.prank(owner);
    //     REGISTRAR.cash(cheqId, amount, owner, cashData);
    // }
}
