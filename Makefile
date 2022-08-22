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
	forge install dapphub/ds-test 
	forge install OpenZeppelin/openzeppelin-contracts

# Update Dependencies
update:; forge update

# Builds
build  :; forge clean && forge build --optimize --optimize-runs 1000000

setup-yarn:
	yarn 

node: 
	anvil

deploy:
	forge create Cheq --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
	forge create src/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 100000000000000000000 dai DAI
	forge create src/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 100000000000000000000 weth WETH

# "networks": {
#     "5777": {
#       "events": {},
#       "links": {},
#       "address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
#       "transactionHash": "0xed82fb5f64d29ebb5bce14c51bb97be9882449913219663ca4a7004ab87e228f"
#     }
#   },