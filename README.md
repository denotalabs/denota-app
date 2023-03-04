# Denota v0.2
Write notas (aka cheqs) to others that are time locked and can be reversed

Contracts implementation located at [src/contracts](src/contracts)

<img src="https://user-images.githubusercontent.com/10327933/212239333-5ca10e12-7572-4293-ba07-9986b025d0bd.png" alt="diagram" width="500"/>

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
Deploy the contracts to the blockchain (local)
```
make deploy-local
```

Deploy the contracts to the blockchain (mumbai)
```
export PRIVATE_KEY=YOUR_KEY
make deploy-mumbai
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
