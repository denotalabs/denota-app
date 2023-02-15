// // SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.16;

import "./mock/erc20.sol";
import "forge-std/Test.sol";
import "forge-std/console.sol";
import { CheqRegistrar } from "src/contracts/CheqRegistrar.sol";
import { DataTypes } from "src/contracts/libraries/DataTypes.sol";
import { SimpleMemo } from "src/contracts/Modules/SimpleMemo.sol";
import { SimpleMemoRules } from "src/contracts/rules/SimpleMemoRules.sol";
import { AllFalseRules } from "src/contracts/rules/AllFalseRules.sol";

// TODO add fail tests
contract SimpleMemoTest is Test {
    CheqRegistrar public REGISTRAR;
    TestERC20 public dai;
    TestERC20 public usdc;
    uint256 public immutable tokensCreated = 1_000_000_000_000e18;

    function isContract(address _addr) public view returns (bool){
        uint32 size;
        assembly {size := extcodesize(_addr)}
        return (size > 0);
    }

    function setUp() public {  // sets up the registrar and ERC20s
        REGISTRAR = new CheqRegistrar(DataTypes.WTFCFees(0,0,0,0));  // ContractTest is the owner
        dai = new TestERC20(tokensCreated, "DAI", "DAI");  // Sends ContractTest the dai
        usdc = new TestERC20(0, "USDC", "USDC");
        // REGISTRAR.whitelistToken(address(dai), true);
        // REGISTRAR.whitelistToken(address(usdc), true);

        vm.label(msg.sender, "Alice");
        vm.label(address(this), "TestContract");
        vm.label(address(dai), "TestDai");
        vm.label(address(usdc), "TestUSDC");
        vm.label(address(REGISTRAR), "CheqRegistrarContract");
    }

    function whitelist(address rule, address module) public {  // Whitelists tokens, rules, modules
        REGISTRAR.whitelistRule(rule, true);
        REGISTRAR.whitelistModule(module, false, true);  // Whitelist bytecode
    }
    /*//////////////////////////////////////////////////////////////
                            WHITELIST TESTS
    //////////////////////////////////////////////////////////////*/
    function testWhitelistToken() public {
        address daiAddress = address(dai);
        vm.prank(address(this));

        // Whitelist tokens
        assertFalse(REGISTRAR.tokenWhitelisted(daiAddress), "Unauthorized whitelist");
        REGISTRAR.whitelistToken(daiAddress, true);
        assertTrue(REGISTRAR.tokenWhitelisted(daiAddress), "Whitelisting failed");
        REGISTRAR.whitelistToken(daiAddress, false);
        assertFalse(REGISTRAR.tokenWhitelisted(daiAddress), "Un-whitelisting failed");

        // Whitelist rules
        SimpleMemoRules simpleMemoRules = new SimpleMemoRules();
        address simpleMemoRulesAddress = address(simpleMemoRules);
        assertFalse(REGISTRAR.ruleWhitelisted(simpleMemoRulesAddress), "Unauthorized whitelist");
        REGISTRAR.whitelistRule(simpleMemoRulesAddress, true); // whitelist bytecode, not address
        assertTrue(REGISTRAR.ruleWhitelisted(simpleMemoRulesAddress), "Whitelisting failed");
        REGISTRAR.whitelistRule(simpleMemoRulesAddress, false);
        assertFalse(REGISTRAR.ruleWhitelisted(simpleMemoRulesAddress), "Un-whitelisting failed");
        REGISTRAR.whitelistRule(simpleMemoRulesAddress, true); // whitelist bytecode, not address

        // Whitelist module
        SimpleMemo simpleMemo = new SimpleMemo(address(REGISTRAR), simpleMemoRulesAddress, simpleMemoRulesAddress, simpleMemoRulesAddress, simpleMemoRulesAddress, simpleMemoRulesAddress, DataTypes.WTFCFees(0,0,0,0), "ipfs://yourmemos.com/");
        address simpleMemoAddress = address(simpleMemo);
        (bool addressWhitelisted, bool bytecodeWhitelisted) = REGISTRAR.moduleWhitelisted(simpleMemoAddress);
        assertFalse(addressWhitelisted || bytecodeWhitelisted, "Unauthorized whitelist");
        REGISTRAR.whitelistModule(simpleMemoAddress, true, false); // whitelist bytecode, not address
        (addressWhitelisted, bytecodeWhitelisted) = REGISTRAR.moduleWhitelisted(simpleMemoAddress);
        assertTrue(addressWhitelisted || bytecodeWhitelisted, "Whitelisting failed");
        REGISTRAR.whitelistModule(simpleMemoAddress, false, false);
        (addressWhitelisted, bytecodeWhitelisted) = REGISTRAR.moduleWhitelisted(simpleMemoAddress);
        assertFalse(addressWhitelisted || bytecodeWhitelisted, "Un-whitelisting failed");
    }
    // function testFailWhitelist(address caller) public {
    //     vm.assume(caller == address(0));  // Deployer can whitelist, test others accounts
    //     Marketplace market = new Marketplace(REGISTRAR);
    //     vm.prank(caller);
    //     REGISTRAR.whitelistModule(market, true);
    //     assertFalse(REGISTRAR.moduleWhitelisted(address(this), market), "Unauthorized whitelist");
    // }

    function setUpSimpleMemo() public returns (SimpleMemo){  // Deploy and whitelist module
        SimpleMemoRules simpleMemoRules = new SimpleMemoRules();
        AllFalseRules falseRules = new AllFalseRules();

        address simpleMemoRulesAddress = address(simpleMemoRules);
        address falseRulesAddress = address(falseRules);

        REGISTRAR.whitelistRule(simpleMemoRulesAddress, true);
        REGISTRAR.whitelistRule(falseRulesAddress, true);

        SimpleMemo simpleMemo = new SimpleMemo(address(REGISTRAR), simpleMemoRulesAddress, falseRulesAddress, simpleMemoRulesAddress, simpleMemoRulesAddress, falseRulesAddress, DataTypes.WTFCFees(0,0,0,0), "ipfs://yourmemos.com/");
        REGISTRAR.whitelistModule(address(simpleMemo), true, false);
        vm.label(address(simpleMemo), "SimpleMemo");
        return simpleMemo;
    }

    /*//////////////////////////////////////////////////////////////
                            MODULE TESTS
    //////////////////////////////////////////////////////////////*/
    function calcFee(uint256 fee, uint256 amount) public pure returns(uint256){
        return (amount * fee) / 10_000;
    }
    function cheqWriteCondition(
        address caller, 
        uint256 amount, 
        uint256 escrowed, 
        address drawer,
        address recipient, 
        address owner
    ) public view returns(bool){
        return
        (amount != 0) &&  // Cheq must have a face value
        (drawer != recipient) && // Drawer and recipient aren't the same
        (owner == drawer || owner == recipient) &&  // Either drawer or recipient must be owner
        (caller == drawer || caller == recipient) &&  // Delegated pay/requesting not allowed
        (escrowed == 0 || escrowed == amount) &&  // Either send unfunded or fully funded cheq
        (recipient != address(0) && owner != address(0) && drawer != address(0)) &&
        // Testing conditions
        (amount <= tokensCreated) &&   // Can't use more token than created
        (caller != address(0)) &&  // Don't vm.prank from address(0)
        !isContract(owner); // Don't send cheqs to non-ERC721Reciever contracts
    }

    function registrarWriteBefore(address caller, address recipient) public {
        assertTrue(REGISTRAR.balanceOf(caller) == 0, "Caller already had a cheq");
        assertTrue(REGISTRAR.balanceOf(recipient) == 0, "Recipient already had a cheq");
        assertTrue(REGISTRAR.totalSupply() == 0, "Cheq supply non-zero");

    }
    function registrarWriteAfter(uint256 cheqId, uint256 amount, uint256 escrowed, address owner, address drawer, address recipient, address module) public {
        assertTrue(REGISTRAR.totalSupply() == 1, "Cheq supply didn't increment");
        assertTrue(REGISTRAR.ownerOf(cheqId) == owner, "`owner` isn't owner of cheq");
        assertTrue(REGISTRAR.balanceOf(owner) == 1, "Owner balance didn't increment");

        // CheqRegistrar wrote correctly to its storage
        assertTrue(REGISTRAR.cheqDrawer(cheqId) == drawer, "Incorrect drawer");
        assertTrue(REGISTRAR.cheqRecipient(cheqId) == recipient, "Incorrect recipient");
        assertTrue(REGISTRAR.cheqCurrency(cheqId) == address(dai), "Incorrect token");
        assertTrue(REGISTRAR.cheqAmount(cheqId) == amount, "Incorrect amount");
        assertTrue(REGISTRAR.cheqEscrowed(cheqId) == escrowed, "Incorrect escrow");
        assertTrue(address(REGISTRAR.cheqModule(cheqId)) == module, "Incorrect module");
    }

    function testWritePay(  // escrow==amount && drawer==caller && recipient==owner
        address caller,
        uint256 amount, 
        address recipient
    ) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 escrowed, address owner) = (caller, amount, recipient);
        vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
        vm.assume(drawer != recipient);
        
        SimpleMemo simpleMemo = setUpSimpleMemo();
        uint256 totalWithFees;
        {
            (uint256 writeFeeBPS, , , ) = REGISTRAR.getFees();
            (uint256 moduleWriteFeeBPS, , , ) = simpleMemo.getFees();
            uint256 registrarFee = calcFee(writeFeeBPS, escrowed);
            console.log("RegistrarFee: ", registrarFee);
            uint256 moduleFee = calcFee(moduleWriteFeeBPS, escrowed);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = escrowed + registrarFee + moduleFee;
            console.log(escrowed, "-->", totalWithFees);
        }

        REGISTRAR.whitelistToken(address(dai), true);
        vm.prank(caller); 
        dai.approve(address(REGISTRAR), totalWithFees);  // Need to get the fee amounts beforehand
        dai.transfer(caller, totalWithFees);
        vm.assume(dai.balanceOf(caller) >= totalWithFees);

        registrarWriteBefore(caller, recipient);
        DataTypes.Cheq memory cheq = DataTypes.Cheq({
            currency: address(dai), 
            amount: amount, 
            escrowed: amount, 
            drawer: drawer, 
            recipient: recipient, 
            module: address(simpleMemo), 
            mintTimestamp: block.timestamp
        });
        bytes memory initData = abi.encode(bytes32(keccak256("this is a hash")));

        vm.prank(caller); 
        uint256 cheqId = REGISTRAR.write(cheq, owner, false, initData);  // Sets caller as owner
        registrarWriteAfter(cheqId, amount, escrowed, owner, drawer, recipient, address(simpleMemo));

        // ICheqModule wrote correctly to it's storage
        string memory tokenURI = REGISTRAR.tokenURI(cheqId);
        console.log("TokenURI: ");
        console.log(tokenURI);
    }
    function testWriteInvoice(  // escrow==0 && drawer==caller && drawer==owner
        address caller,
        uint256 amount, 
        address recipient
    ) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 escrowed, address owner) = (caller, 0, caller);
        vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
        vm.assume(drawer != recipient);
        
        SimpleMemo simpleMemo = setUpSimpleMemo();
        uint256 totalWithFees;
        {
            (uint256 writeFeeBPS, , , ) = REGISTRAR.getFees();
            (uint256 moduleWriteFeeBPS, , , ) = simpleMemo.getFees();
            uint256 registrarFee = calcFee(writeFeeBPS, escrowed);
            console.log("RegistrarFee: ", registrarFee);
            uint256 moduleFee = calcFee(moduleWriteFeeBPS, escrowed);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = escrowed + registrarFee + moduleFee;
            console.log(escrowed, "-->", totalWithFees);
        }

        REGISTRAR.whitelistToken(address(dai), true);
        vm.prank(caller); 
        dai.approve(address(REGISTRAR), totalWithFees);  // Need to get the fee amounts beforehand
        dai.transfer(caller, totalWithFees);
        vm.assume(dai.balanceOf(caller) >= totalWithFees);

        registrarWriteBefore(caller, recipient);
        DataTypes.Cheq memory cheq = DataTypes.Cheq({
            currency: address(dai), 
            amount: amount, 
            escrowed: escrowed, 
            drawer: drawer, 
            recipient: recipient, 
            module: address(simpleMemo), 
            mintTimestamp: block.timestamp
        });
        bytes memory initData = abi.encode(bytes32(keccak256("this is another hash")));

        vm.prank(caller); 
        uint256 cheqId = REGISTRAR.write(cheq, owner, false, initData);  // Sets caller as owner
        registrarWriteAfter(cheqId, amount, escrowed, owner, drawer, recipient, address(simpleMemo));

        // ICheqModule wrote correctly to it's storage
        string memory tokenURI = REGISTRAR.tokenURI(cheqId);
        console.log("TokenURI: ");
        console.log(tokenURI);
    }

    function writeHelper(address caller, uint256 amount, uint256 escrowed, address drawer, address recipient, address owner) public returns(uint256, SimpleMemo){ 
        SimpleMemo simpleMemo = setUpSimpleMemo();
        uint256 totalWithFees;
        {
            (uint256 writeFeeBPS, , , ) = REGISTRAR.getFees();
            (uint256 moduleWriteFeeBPS, , , ) = simpleMemo.getFees();
            uint256 registrarFee = calcFee(writeFeeBPS, escrowed);
            console.log("RegistrarFee: ", registrarFee);
            uint256 moduleFee = calcFee(moduleWriteFeeBPS, escrowed);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = escrowed + registrarFee + moduleFee;
            console.log(escrowed, "-->", totalWithFees);
        }
        REGISTRAR.whitelistToken(address(dai), true);
        vm.prank(caller); 
        dai.approve(address(REGISTRAR), totalWithFees);  // Need to get the fee amounts beforehand
        dai.transfer(caller, totalWithFees);
        vm.assume(dai.balanceOf(caller) >= totalWithFees);

        registrarWriteBefore(caller, recipient);
        DataTypes.Cheq memory cheq = DataTypes.Cheq({
            currency: address(dai), 
            amount: amount, 
            escrowed: escrowed, 
            drawer: drawer, 
            recipient: recipient, 
            module: address(simpleMemo), 
            mintTimestamp: block.timestamp
        });
        bytes memory initData = abi.encode(bytes32(keccak256("this is a hash")));

        vm.prank(caller); 
        uint256 cheqId = REGISTRAR.write(cheq, owner, false, initData);  // Sets caller as owner
        registrarWriteAfter(cheqId, amount, escrowed, owner, drawer, recipient, address(simpleMemo));

        // uint256 senderBalanceOf = REGISTRAR.balanceOf(caller);
        // uint256 recipientBalanceOf = REGISTRAR.balanceOf(recipient);
        // uint256 cheqSupply = REGISTRAR.totalSupply();
        // assertTrue(REGISTRAR.balanceOf(caller) == 0, "Caller already got a cheq");
        // assertTrue(REGISTRAR.balanceOf(recipient) == 0);

        // vm.prank(sender);
        // helperCheqInfo(cheqId, amount, sender, recipient, sstl, duration);

        // if (escrow == amount && amount != 0){ // Cheq 
        //     assertTrue(cheq.balanceOf(sender) == senderBalanceOf, "Recipient gained a cheq"); 
        //     assertTrue(cheq.balanceOf(recipient) == recipientBalanceOf + 1, "Recipient didnt get a cheq"); 
        //     assertTrue(cheq.ownerOf(cheqId) == recipient, "Recipient isn't owner"); 
        // } else {  // Invoice
        //     assertTrue(cheq.balanceOf(sender) == senderBalanceOf + 1, "Invoicer didn't get a cheq");
        //     assertTrue(cheq.balanceOf(recipient) == recipientBalanceOf, "Funder gained a cheq");
        //     assertTrue(cheq.ownerOf(cheqId) == sender, "Invoicer isn't owner");
        // }
        // assertTrue(cheq.totalSupply() == cheqSupply + 1, "Cheq supply didn't increment");

        return (cheqId, simpleMemo);
    }

    function testTransferPay(address caller, uint256 amount, address recipient) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 escrowed, address owner) = (caller, amount, recipient);
        vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
        vm.assume(drawer != recipient);
        
        uint256 cheqId = writeHelper(caller, amount, escrowed, drawer, recipient, owner);
        vm.expectRevert(bytes("TransferRule: Disallowed"));
        REGISTRAR.transferFrom(owner, drawer, cheqId);  // Reverse the payment
    }

    function testTransferInvoice(address caller, uint256 amount, address recipient) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 escrowed, address owner) = (caller, 0, caller);
        vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
        vm.assume(drawer != recipient);
        
        // Need to test transfering from a Payment and an Invoice
        // address owner = recipient;
        uint256 cheqId = writeHelper(caller, amount, escrowed, drawer, recipient, owner);
        vm.expectRevert(bytes("TransferRule: Disallowed"));  // Reverse the payment
        REGISTRAR.transferFrom(owner, drawer, cheqId);
    }

    function testFundPay(address caller, uint256 amount, address drawer, address recipient) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 escrowed, address owner) = (caller, amount, caller);
        vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
        vm.assume(drawer != recipient);

        uint256 cheqId = writeHelper(caller, amount, escrowed, drawer, recipient, owner);
        bytes memory fundData =  abi.encode(bytes32(""));

        vm.expectRevert(bytes("Rule: Only recipient"));
        REGISTRAR.fund(cheqId, amount, false, fundData);
    }

    function testFundInvoice(address caller, uint256 amount, address drawer, address recipient) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 escrowed, address owner) = (caller, 0, caller);
        vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
        vm.assume(drawer != recipient);
        // address owner = recipient;
        uint256 cheqId = writeHelper(caller, amount, escrowed, drawer, recipient, owner);
        bytes memory fundData =  abi.encode(bytes32(""));

        vm.prank(recipient); 
        dai.approve(address(REGISTRAR), amount);  // Need to get the fee amounts beforehand
        dai.transfer(recipient, amount);
        // vm.assume(dai.balanceOf(caller) >= totalWithFees);
        vm.prank(recipient);
        REGISTRAR.fund(cheqId, amount, false, fundData);
    }

    function testCashPay(address caller, uint256 amount, address drawer, address recipient) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 escrowed, address owner) = (caller, amount, caller);
        vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
        vm.assume(drawer != recipient);

        (uint256 cheqId, ) = writeHelper(caller, amount, escrowed, drawer, recipient, owner);
        bytes memory cashData =  abi.encode(bytes32(""));

        vm.prank(owner);
        REGISTRAR.cash(cheqId, escrowed, owner, cashData);
    }

    function fundHelper(uint256 cheqId, address funder, uint256 amount, SimpleMemo simpleMemo) public {
        bytes memory fundData =  abi.encode(bytes32(""));

        uint256 totalWithFees;
        {
            ( , , uint256 fundFeeBPS, ) = REGISTRAR.getFees();
            ( , , uint256 moduleFeeBPS, ) = simpleMemo.getFees();
            uint256 registrarFee = calcFee(fundFeeBPS, amount);
            console.log("RegistrarFee: ", registrarFee);
            uint256 moduleFee = calcFee(moduleFeeBPS, amount);
            console.log("ModuleFee: ", moduleFee);
            totalWithFees = amount + registrarFee + moduleFee;
            console.log(amount, "-->", totalWithFees);
        }

        vm.prank(funder); 
        dai.approve(address(REGISTRAR), totalWithFees);  // Need to get the fee amounts beforehand
        dai.transfer(funder, totalWithFees);
        
        vm.prank(funder);
        REGISTRAR.fund(cheqId, amount, false, fundData);
    }

    function testCashInvoice(address caller, uint256 amount, address drawer, address recipient) public {
        vm.assume(amount != 0 && amount <= tokensCreated);
        (address drawer, uint256 escrowed, address owner) = (caller, 0, caller);
        vm.assume(caller != address(0) && recipient != address(0) && !isContract(owner));
        vm.assume(drawer != recipient);
        
        (uint256 cheqId, SimpleMemo simpleMemo) = writeHelper(caller, amount, escrowed, drawer, recipient, owner);

        fundHelper(cheqId, recipient, amount, simpleMemo);

        bytes memory cashData =  abi.encode(bytes32(""));
        vm.prank(owner);
        REGISTRAR.cash(cheqId, amount, owner, cashData);
    }
}