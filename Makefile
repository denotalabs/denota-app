# include .env file and export its env vars
# (-include to ignore error if it does not exist)
-include .env

all: clean remove install update solc build 

# Install proper solc version.
solc:; nix-env -f https://github.com/dapphub/dapptools/archive/master.tar.gz -iA solc-static-versions.solc_0_8_10

# Clean the repo
clean  :; forge clean

# Remove modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

# Install the Modules
install :; 
	forge install dapphub/ds-test --no-commit
	forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Update Dependencies
update:; forge update

setup-yarn:
	yarn 

# Install Foundry, node packages, and foundry libraries
fresh-install:
	curl -L https://foundry.paradigm.xyz | bash  # Need to reload PATH before foundryup
	foundryup
	npm install
	# make install  # forge build installs these

# Builds
build  :; forge clean && forge build --optimize --optimizer-runs 1000000

run: 
	(npm run dev | sed -e 's/^/[NPM] : /' & anvil | sed -e 's/^/[ANVIL] : /')

deploy:
	# key1=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
	# key2=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
	# key3=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
	# export cheqAddress=$(python3 returnAddress.py "src/out/Cheq.sol/CheqAddress.json") && \
	# address1=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 && \
	# address2=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 && \
	# address3=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC && \
	
	# Local
	forge create Cheq --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --json > ./src/out/Cheq.sol/CheqAddress.json
	forge create src/test/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 10000000000000000000000000 dai DAI --json > ./src/out/ERC20.sol/DaiAddress.json
	forge create src/test/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 10000000000000000000000000 weth WETH --json > ./src/out/ERC20.sol/WethAddress.json
	
	# Mumbai
	# forge create src/contracts/CheqRegistrar.sol:CheqRegistrar --private-key 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --rpc-url https://matic-mumbai.chainstacklabs.com
	# forge create src/contracts/CheqRegistrar.sol:SelfSignTimeLock --private-key 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --rpc-url https://matic-mumbai.chainstacklabs.com --constructor-args 0x98E39bC9849131187cbC6a180a321Cc88fF264Ed --gas-price 30gwei
	# forge create src/test/mock/erc20.sol:TestERC20 --private-key 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --rpc-url https://matic-mumbai.chainstacklabs.com --constructor-args 10000000000000000000000000 dai DAI --gas-price 30gwei
	# forge create src/test/mock/erc20.sol:TestERC20 --private-key 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --rpc-url https://matic-mumbai.chainstacklabs.com --constructor-args 10000000000000000000000000 weth WETH --gas-price 30gwei
	# cast send 0x98E39bC9849131187cbC6a180a321Cc88fF264Ed "whitelistBroker(address,bool,string)" 0x38C112ED27d421DDBC8069892e0614A39AAe72a1 "true" --private-key 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --rpc-url https://matic-mumbai.chainstacklabs.com --gas-price 30gwei
	# cast send 0x38C112ED27d421DDBC8069892e0614A39AAe72a1 "whitelistToken(address,bool)" 0x63d98DB901EDD4dFFA7A0aFEBE0CcB850435CfA3 "true" --private-key 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --rpc-url https://matic-mumbai.chainstacklabs.com --gas-price 30gwei
	# cast send 0x38C112ED27d421DDBC8069892e0614A39AAe72a1 "whitelistToken(address,bool)" 0xAA6DA55ba764428e1C4c492c6db5FDe3ccf57332 "true" --private-key 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a --rpc-url https://matic-mumbai.chainstacklabs.com --gas-price 30gwei

graph-start:
	# Requires docker to be running
	npm run clean-graph-node # If node has run before remove the old subgraph
	npm run run-graph-node  # (re)start the node [postgres & ipfs & blockchain ingester]
	# npm run codegen

graph-deploy-local:
	npm run codegen
	npm run graph-build  # Creates the instructions to transform block input to subgraph format to store in db (contract ABI -> typescript classes: for mapping.ts file to import)
	npm run codegen
	npm run create-local # 

	# cd src/graph/subgraph && npm run codegen && npm run deploy-local
	npm run graph-ship-local  # Send the subgraph to the node (May need delay before this command if graphNode not ready to receive subgraph)

graph-deploy-remote:
	npm run codegen
	npm run graph-build  # Creates the instructions to transform block input to subgraph format to store in db (contract ABI -> typescript classes: for mapping.ts file to import)
	npm run create-remote # 

	# cd src/graph/subgraph && npm run codegen && npm run deploy-local
	npm run graph-ship-remote  # Send the subgraph to the node (May need delay before this command if graphNode not ready to receive subgraph)
