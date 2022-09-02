# Cheq v0.0
Deposit ETH and write cheques to others that are time locked and can be reversed

1. Deposit ETH into the dApp
2. writeCheque() to an address for an amount specified
3. The recipient can cashCheque() once the check matures and the dApp will transfer the ETH
4. If the drawer of the cheque decides to void the payment, their trusted reviewer can do so on their behalf
## Set up
Run the command below to install from scratch:
```
make fresh-install
```
Run the front-end:
```
npm run dev
```
Run the local blockchain for deployment/testing:
```
anvil
```
forge build
```
Deploy the contracts to the blockchain
```
make deploy
```


Run the commands below to update dependencies:
```
forge update lib/forge-std
forge update lib/openzeppelin-contracts
```
## Linting/Formatting
Run ```npm run solhint``` for linting to see Solidity warnings and errors.
Use ```npm run prettier:ts``` and ```npm run prettier:solidity``` to manually format TypeScript and Solidity.
These commands are automatically run pre-push via [Husky](https://github.com/typicode/husky) Git hooks.
## Foundry/Forge Tips
Check out the [Foundry Book](https://book.getfoundry.sh/) for more specifics.
### Updating Dependencies
```forge update``` will update all dependencies at once.
### Testing
```forge test``` will run all tests.
```forge test -m nameOfTest``` will run a specific test.

## Frontend
[Tutorial Template codebase was based on (dBank by Dapp University)](https://github.com/dappuniversity/dbank)
