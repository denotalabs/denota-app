
import json
import re
import shlex
import subprocess
import sys

"""
Steps to deploy to a new chain:

1. Add the RPC to rpc_for_chain in this file

2. Append chain:rpc to environment/ethereum in docker-compose.yml

3. Run python3 deployCheq [privateKey] [chain]

4. Run export GQL_HOST=server && export GRAPH_CHAIN=chain && make graph-deploy-remote
(Optionally, add new make command for the chain)

5. If neccesary, update chainInfo.ts with info for the new chain and set isDisabled=false

contractAddresses.tsx should automatically have been updated
TODO: figure out how to get nginx wildcard paths working properly, manually add a path for each chain for now
"""


def extract_address(input):
    try:
        return re.search('Deployed to: (.*)', input).group(1)
    except AttributeError:
        sys.exit("Unable to parse contract address")


def eth_call(command, error):
    result = subprocess.run(
        shlex.split(command),
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    if result.stderr:
        print(error)
        sys.exit(result.stderr)
    return result


def rpc_for_chain(chain):
    chain_rpc = {
        "arbitrum": "https://goerli-rollup.arbitrum.io/rpc",
        "alfajores": "https://alfajores-forno.celo-testnet.org",
        "base": "https://goerli.base.org",
        "bnb": "https://data-seed-prebsc-1-s3.binance.org:8545",
        "gnosis": "https://rpc.ankr.com/gnosis",  # MAINNET
        # "goerli":  "https://goerli.blockpi.network/v1/rpc/public", # Will be deprecated
        "sepolia": "https://rpc2.sepolia.org",
        "mumbai": "https://matic-mumbai.chainstacklabs.com",
        "optimism": "https://goerli.optimism.io",
        "zksync": "https://zksync2-testnet.zksync.dev"
    }
    return chain_rpc.get(chain, "http://127.0.0.1:8545")


def native_token_name_chain(chain):
    chain_token_name = {
        "arbitrum": "ETH",
        "alfajores": "CELO",
        "base": "ETH",
        "bnb": "BNB",
        "gnosis": "DAI",
        # "goerli":  "ETH",
        "sepolia": "ETH",
        "mumbai": "MATIC",
        "optimism": "ETH",
        "zksync": "ETH"
    }
    return chain_token_name[chain]


if __name__ == "__main__":
    chain = sys.argv[2]
    key = sys.argv[1]  # load up from from the .env file directly?
    rpc = rpc_for_chain(chain)
    rpc_key_flags = f"--private-key {key} --rpc-url {rpc} --gas-price 30gwei"
    with open("contractAddresses.json", 'r') as f:
        existing_addresses = json.loads(f.read())

    # Deploy libraries
    datatypes = "src/libraries/DataTypes.sol:DataTypes"
    errors = "src/libraries/Errors.sol:Errors"
    events = "src/libraries/Events.sol:Events"
    library_paths = [datatypes, errors, events]
    lib_addresses = []
    for library_path in library_paths:
        name = library_path.split(":")[-1]
        if not existing_addresses[chain][name]:
            result = eth_call(
                f'forge create {library_path} {rpc_key_flags}', "Library deployment failed")
            address = extract_address(result.stdout)
            existing_addresses[chain][name] = str(address)
        else:
            address = existing_addresses[chain][name]
        lib_addresses.append(library_path + ":" + address)
        print(f"{name} library: {address}")
    libraries_flag = f"--libraries {' '.join(lib_addresses)}"

    # Deploy the CheqRegistrar
    block_number = (
        eth_call(f'cast block-number --rpc-url {rpc}', "Block failed to fetch")).stdout
    if not existing_addresses[chain]["registrar"]:
        registar_path = "src/CheqRegistrar.sol:CheqRegistrar"
        result = eth_call(
            f'forge create {registar_path} {rpc_key_flags}', "Registrar deployment failed")
        registrar = extract_address(result.stdout)
        existing_addresses[chain]["registrar"] = registrar
    else:
        registrar = existing_addresses[chain]["registrar"]
    print(f'Registrar address: {registrar}')

    # Deploy ERC20s for testing
    erc20_path, tokens = "src/test/mock/erc20.sol:TestERC20", []
    for (supply, name, symbol) in [(10000000e18, "weth", "WETH"), (10000000e18, "dai", "DAI")]:
        if not existing_addresses[chain][name]:
            result = eth_call(
                f'forge create {erc20_path} --constructor-args {supply} {name} {symbol} {rpc_key_flags}', "ERC20 deployment failed")
            token = extract_address(result.stdout)
            existing_addresses[chain][name] = token
        else:
            token = existing_addresses[chain][name]
        print(f'{symbol} address: {token}')
        tokens.append((token, name, symbol))

    # Deploy the DirectPay module
    if not existing_addresses[chain]["directPay"]:
        DirectPay_path = "src/modules/DirectPay.sol:DirectPay"
        result = eth_call(
            f'forge create {DirectPay_path} --constructor-args {registrar} "(0,0,0,0)" "ipfs://" {rpc_key_flags}', "Module deployment failed")
        direct_pay = extract_address(result.stdout)
        existing_addresses[chain]["directPay"] = direct_pay
        # Whitelist the DirectPay module
        eth_call(
            f'cast send {registrar} "whitelistModule(address,bool,bool,string)" {direct_pay} "false" "true" "DirectPay" {rpc_key_flags}', "Whitelist module failed")
        print(f'DirectPay address: {direct_pay}')
    else:
        direct_pay = existing_addresses[chain]["directPay"]

    # Update the address JSON
    with open("contractAddresses.json", 'w') as f:
        f.write(json.dumps(existing_addresses))

    if not existing_addresses[chain]["escrow"]:
        Escrow_path = "src/modules/ReversibleRelease.sol:ReversibleRelease"
        result = eth_call(
            f'forge create {Escrow_path} --constructor-args {registrar} "(0,0,0,0)" "ipfs://" {rpc_key_flags}', "Module deployment failed")
        escrow = extract_address(result.stdout)
        existing_addresses[chain]["escrow"] = escrow
        # Whitelist the Escrow module
        eth_call(
            f'cast send {registrar} "whitelistModule(address,bool,bool,string)" {escrow} "false" "true" "ReversibleRelease" {rpc_key_flags}', "Whitelist module failed")
        print(f'Escrow address: {escrow}')

    # Update the address JSON
    with open("contractAddresses.json", 'w') as f:
        f.write(json.dumps(existing_addresses))

    with open("../frontend/context/contractAddresses.tsx", 'w') as f:
        f.write("export const ContractAddressMapping = " +
                json.dumps(existing_addresses))

    with open("../graph/subgraph/config/" + chain + ".json", 'w') as f:
        existing_addresses[chain]["network"] = chain
        # Queried right before deployements
        existing_addresses[chain]["startBlock"] = block_number.strip("\n")
        f.write(json.dumps(existing_addresses[chain]))

    # Whitelist tokens
    for (token, name, symbol) in tokens:
        eth_call(
            f'cast send {registrar} "whitelistToken(address,bool,string)" {token} "true" {symbol} {rpc_key_flags}', "Whitelist token failed")

    native_token_name = native_token_name_chain(chain)
    eth_call(
        f'cast send {registrar} "whitelistToken(address,bool,string)" "0x0000000000000000000000000000000000000000" "true" {native_token_name} {rpc_key_flags}', "Whitelist token failed")
    # print(
    #     f"cast call {registrar} 'tokenURI(uint256)' '0' --rpc-url {rpc}")
