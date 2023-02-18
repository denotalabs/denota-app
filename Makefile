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

# TODO: fails on fleek due to "GLIBC_2.29 not found"
build-forge:
	curl -L https://foundry.paradigm.xyz | bash  # Need to reload PATH before foundryup
	~/.foundry/bin/foundryup
	~/.foundry/bin/forge build

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

deploy-local:
	python3 deployCheq.py "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a" "http://127.0.0.1:8545"
	
deploy-mumbai:
	python3 deployCheq.py ${PRIVATE_KEY} "https://matic-mumbai.chainstacklabs.com"
deploy:
	if [$1 = "mumbai"]
	then
		export RPC="https://matic-mumbai.chainstacklabs.com"
	else
		export RPC="http://127.0.0.1:8545"
	fi

	source .env

	# Deploy the CheqRegistrar
	forge create src/contracts/CheqRegistrar.sol:CheqRegistrar --constructor-args "DataTypes.WTFCFees _fees" --private-key $(privateKey) --rpc-url $(RPC)
	export cheqAddress=$(python3 returnAddress.py "src/out/CheqRegistrar.sol/CheqRegistrar.json")

	# Deploy the ERC20s
	forge create src/test/mock/erc20.sol:TestERC20 --constructor-args 10000000000000000000000000 weth WETH --private-key $(privateKey) --rpc-url $(RPC) --gas-price 30gwei
	export erc1Address=$(python3 returnAddress.py "src/out/erc20.sol/TestERC20.json")
	# forge create src/test/mock/erc20.sol:TestERC20 --constructor-args 10000000000000000000000000 dai DAI --private-key $(privateKey) --rpc-url $(RPC) --gas-price 30gwei
	# export erc2Address=$(python3 returnAddress.py "src/out/erc20.sol/TestERC20.json")

	# Deploy the DirectPayRules
	forge create src/contracts/DirectPay.sol:DirectPayRules --private-key $(privateKey) --rpc-url $(RPC)
	export directPayRulesAddress=$(python3 returnAddress.py "src/out/DirectPay.sol/DirectPayRules.json")

	# Whitelist the rules
	cast send $(cheqAddress) "whitelistRule(address,bool)" "RULE_ADDRESS" "true" --private-key $(privateKey) --rpc-url $(RPC) --gas-price 30gwei

	# Deploy the DirectPay module
	## address registrar, address _writeRule, address _transferRule,  address _fundRule,  address _cashRule,  address _approveRule, DataTypes.WTFCFees memory _fees, string memory __baseURI
	forge create src/contracts/DirectPay.sol:DirectPay --constructor-args 0x98E39bC9849131187cbC6a180a321Cc88fF264Ed --private-key $(privateKey) --rpc-url $(RPC) --gas-price 30gwei
	export directPayAddress=$(python3 returnAddress.py "src/out/DirectPay.sol/DirectPay.json")

	# Whitelist the DirectPay module
	cast send $(cheqAddress) "whitelistModule(address,bool)" $(directPayAddress) "true" --private-key $(privateKey) --rpc-url $(RPC) --gas-price 30gwei

	# Whitelist tokens
	# cast send $(cheqAddress) "whitelistToken(address,bool)" ERC20_ADDRESS "true" --private-key $(privateKey) --rpc-url $(RPC) --gas-price 30gwei
	# cast send $(cheqAddress) "whitelistToken(address,bool)" ERC20_ADDRESS "true" --private-key $(privateKey) --rpc-url $(RPC) --gas-price 30gwei

	# export cheqAddress=$(python3 returnAddress.py "src/out/Cheq.sol/CheqAddress.json")


# Local
# forge create Cheq --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --json > ./src/out/Cheq.sol/CheqAddress.json
# forge create src/test/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 10000000000000000000000000 dai DAI --json > ./src/out/ERC20.sol/DaiAddress.json
# forge create src/test/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 10000000000000000000000000 weth WETH --json > ./src/out/ERC20.sol/WethAddress.json

graph-start:
	# Requires docker to be running
	npm run clean-graph-node # If node has run before remove the old subgraph
	npm run run-graph-node  # (re)start the node [postgres & ipfs & blockchain ingester]
	# npm run codegen

graph-deploy-local:
	npm run graph-prepare-mumbai
	npm run create-local # 
	npm run graph-ship-local  # Send the subgraph to the node (May need delay before this command if graphNode not ready to receive subgraph)

graph-deploy-remote:
	npm run graph-prepare-mumbai
	npm run graph-create-remote # 
	npm run graph-ship-remote  # Send the subgraph to the node (May need delay before this command if graphNode not ready to receive subgraph)
