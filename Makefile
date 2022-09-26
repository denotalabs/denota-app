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
	forge create Cheq --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --json > ./src/out/Cheq.sol/CheqAddress.json
	forge create src/test/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 100000000000000000000 dai DAI --json > ./src/out/ERC20.sol/DaiAddress.json
	forge create src/test/mock/erc20.sol:TestERC20 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545 --constructor-args 100000000000000000000 weth WETH --json > ./src/out/ERC20.sol/WethAddress.json
	

	##############################################  Convert script to bash commands  ##############################################
	# Users request auditor
	## vm.broadcast(address1);
	## cheq.acceptAuditor(address3, true);
	# cast send $(cheqAddress) "acceptAuditor(address,bool)" $(address3) "true" --from $(address1) 

	## vm.broadcast(address2);
	## cheq.acceptAuditor(address3, true);
	# cast send $(cheqAddress) "acceptAuditor(address,bool)" $(address3) "true" --from $(address2) 

	# Auditor requests users
	## vm.broadcast(address3);
	## cheq.acceptUser(address1, true);
	# cast send $(cheqAddress) "acceptUser(address,bool)" $(address1) "true" --from $(address3) 

	## vm.broadcast(address3);
	## cheq.acceptUser(address2, true);
	# cast send $(cheqAddress) "acceptUser(address,bool)" $(address2) "true" --from $(address3) 

	# cheqAddress=$(python3 returnAddress.py "src/out/Cheq.sol/CheqAddress.json")
	# cast send $cheqAddress "acceptAuditor(address,bool)" 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC "true" --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
	# cast send $cheqAddress "acceptAuditor(address,bool)" 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC "true" --from 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
	# cast send $cheqAddress "acceptUser(address,bool)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 "true" --from 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
	# cast send $cheqAddress "acceptUser(address,bool)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 "true" --from 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
	# cast send $cheqAddress "setAllowedDuration(uint256)" 604800 --from 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
	
	# # key1=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
	# # key2=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
	# # key3=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
	# # export cheqAddress=$(python3 returnAddress.py "src/out/Cheq.sol/CheqAddress.json") && \
	# # address1=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 && \
	# # address2=0x70997970C51812dc3A010C7d01b50e0d17dc79C8 && \
	# # address3=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC && \
	# # cast send $(cheqAddress) "acceptAuditor(address,bool)" $(address3) "true" --from $(address1) && \
	# # cast send $(cheqAddress) "acceptAuditor(address,bool)" $(address3) "true" --from $(address2) && \
	# # cast send $(cheqAddress) "acceptUser(address,bool)" $(address1) "true" --from $(address3) && \
	# # cast send $(cheqAddress) "acceptUser(address,bool)" $(address2) "true" --from $(address3) && \
	# # cast send $(cheqAddress) "setAllowedDuration(uint256)" 604800 --from $(address3)
	
	# forge create --rpc-url https://matic-mumbai.chainstacklabs.com --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/contracts/Cheq.sol:Cheq  

graph:
	npm run clean-graph-node # If node has run before
	npm run run-graph-node
	npm run graph-build
	npm run create-local # May need delay before this command if graphNode not ready to receive subgraph
	npm run graph-ship-local