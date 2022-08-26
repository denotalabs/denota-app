# Cheq v0.0
Deposit ETH and write cheques to others that are time locked and can be reversed

1. Deposit ETH into the dApp
2. writeCheque() to an address for an amount specified
3. The recipient can cashCheque() once the check matures and the dApp will transfer the ETH
4. If the drawer of the cheque decides to void the payment, their trusted reviewer can do so on their behalf


## Linting/Formatting
Run ```npm run solhint``` for linting to see Solidity warnings and errors.
Use ```npm run prettier:ts``` and ```npm run prettier:solidity``` to manually format TypeScript and Solidity.
These commands are automatically run pre-push via [Husky](https://github.com/typicode/husky) Git hooks.
## Foundry/Forge Tips
Check out the [Foundry Book](https://book.getfoundry.sh/) for more specifics.
### Anvil
Use ```anvil``` creates a local testnet node for deployment/testing.
### Updating Dependencies
```forge update``` will update all dependencies at once.
### Testing
```forge test``` will run all tests.
```forge test -m nameOfTest``` will run a specific test.