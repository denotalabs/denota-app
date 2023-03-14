
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
  if chain == "mumbai":
    return "https://matic-mumbai.chainstacklabs.com"
  if chain == "alfajores":
    return "https://alfajores-forno.celo-testnet.org"
  return "http://127.0.0.1:8545"

if __name__ == "__main__":
  chain = sys.argv[2]
  key = sys.argv[1]  # load up from from the .env file directly?
  rpc = rpc_for_chain(chain)
  rpc_key_flags = f"--private-key {key} --rpc-url {rpc} --gas-price 30gwei"
  with open("contractAddresses.json", 'r') as f:
    existing_addresses = json.loads(f.read())

  # Deploy libraries
  datatypes = "src/contracts/libraries/DataTypes.sol:DataTypes"
  errors = "src/contracts/libraries/Errors.sol:Errors"
  events = "src/contracts/libraries/Events.sol:Events"
  library_paths = [datatypes, errors, events]
  lib_addresses = []
  for library_path in library_paths:
    name = library_path.split(":")[-1]
    if not existing_addresses[chain][name]:
      result = eth_call(f'forge create {library_path} {rpc_key_flags}', "Library deployment failed")
      address = extract_address(result.stdout)
      existing_addresses[chain][name] = str(address)
    else:
      address = existing_addresses[chain][name]
    lib_addresses.append(library_path + ":" + address)
    print(f"{name} library: {address}")
  libraries_flag = f"--libraries {' '.join(lib_addresses)}"

  # Deploy the CheqRegistrar
  con_args = "(0,0,0,0)" #{"writeBPS": 0, "transferBPS": 0, "fundBPS": 0, "cashBPS": 0}
  if not existing_addresses[chain]["registrar"]:
    registar_path = "src/contracts/CheqRegistrar.sol:CheqRegistrar"
    result = eth_call(f'forge create {registar_path} --constructor-args {con_args} {rpc_key_flags}', "Registrar deployment failed")
    registrar = extract_address(result.stdout)
    existing_addresses[chain]["registrar"] = registrar
  else:
    registrar = existing_addresses[chain]["registrar"]
  print(f'Registrar address: {registrar}')

  # Deploy ERC20s for testing
  erc20_path, tokens = "src/test/mock/erc20.sol:TestERC20", []
  for (supply, name, symbol) in [(10000000000000000000000000, "weth", "WETH"), (10000000000000000000000000, "dai", "DAI")]:
    if not existing_addresses[chain][name]:
      result = eth_call(f'forge create {erc20_path} --constructor-args {supply} {name} {symbol} {rpc_key_flags}', "ERC20 deployment failed")
      token = extract_address(result.stdout)
      existing_addresses[chain][name] = token
    else:
      token = existing_addresses[chain][name]
    print(f'{symbol} address: {token}')
    tokens.append(token)

  # Deploy the DirectPay module
  if not existing_addresses[chain]["directPay"]:
    DirectPay_path = "src/contracts/modules/DirectPay.sol:DirectPay"
    result = eth_call(f'forge create {DirectPay_path} --constructor-args {registrar} {con_args} "ipfs://" {rpc_key_flags}', "Module deployment failed")
    direct_pay = extract_address(result.stdout)
    existing_addresses[chain]["directPay"] = direct_pay
    print(f'DirectPay address: {direct_pay}')
  else:
    direct_pay = existing_addresses[chain]["directPay"]

  # Update the address JSON
  with open("contractAddresses.json", 'w') as f:
    f.write(json.dumps(existing_addresses))

  with open("src/context/contractAddresses.tsx", 'w') as f:
    f.write("export const ContractAddressMapping = " + json.dumps(existing_addresses))

  with open("src/graph/subgraph/config/" + chain + ".json", 'w') as f:
    existing_addresses[chain]["network"] = chain 
    existing_addresses[chain]["startBlock"] = "START"
    f.write(json.dumps(existing_addresses[chain]))

  # Whitelist the DirectPay module
  eth_call(f'cast send {registrar} "whitelistModule(address,bool,bool)" {direct_pay} "false" "true" {rpc_key_flags}', "Whitelist module failed")

  # Whitelist tokens
  for token in tokens:
    eth_call(f'cast send {registrar} "whitelistToken(address,bool)" {token} "true" {rpc_key_flags}', "Whitelist token failed")
  
  eth_call(f'cast send {registrar} "whitelistToken(address,bool)" "0x0000000000000000000000000000000000000000" "true" {rpc_key_flags}', "Whitelist token failed")
