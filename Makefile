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
build  :; forge clean && forge build --optimize --optimize-runs 1000000

run: 
	(npm run dev | sed -e 's/^/[NPM] : /' & anvil | sed -e 's/^/[ANVIL] : /')

deploy:
	forge create Cheq --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --json > ./src/out/Cheq.sol/CheqAddress.json
	forge create src/test/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 100000000000000000000 dai DAI --json > ./src/out/ERC20.sol/DaiAddress.json
	forge create src/test/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 100000000000000000000 weth WETH --json > ./src/out/ERC20.sol/WethAddress.json
