# Cheq v0.0
Deposit ETH and write cheques to others that are time locked and can be reversed

Contract implementation located at [src/contracts/Cheq.sol](src/contracts/Cheq.sol)


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
## Foundry/Forge Tips
Check out the [Foundry Book](https://book.getfoundry.sh/) for more specifics.

### Updating Dependencies
```forge update``` will update all dependencies at once.

### Testing
```forge test``` will run all tests.
```forge test -m nameOfTest``` will run a specific test.

## Linting/Formatting
Run ```npm run solhint``` for linting to see Solidity warnings and errors.
Use ```npm run prettier:ts``` and ```npm run prettier:solidity``` to manually format TypeScript and Solidity.
These commands are automatically run pre-push via [Husky](https://github.com/typicode/husky) Git hooks.

## Cheq subgraph (local)

Install [Docker](https://docs.docker.com/desktop/install/mac-install/)

To boostrap the local graph node, run: 

```make graph-start```

In another tab, build and deploy the subgraph by running:

```graph-deploy-local```

### Graph Resources/Links
[AssemblyScript API](https://thegraph.com/docs/en/developing/assemblyscript-api/)
