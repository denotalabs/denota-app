
import shlex, subprocess, re, sys, json

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

if __name__ == "__main__":
  chain = sys.argv[2]; chain = chain if chain == "mumbai" else "local"
  key = sys.argv[1]; key = key if chain == "mumbai" else "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"  # load up from from the .env file directly?
  rpc = "https://matic-mumbai.chainstacklabs.com" if (chain == "mumbai") else "http://127.0.0.1:8545"
  rpc_key_flags = f"--private-key {key} --rpc-url {rpc} --gas-price 30gwei"
  with open("contractAddresses.json", 'r') as f:
    existing_addresses = json.loads(f.read())

  # Deploy libraries
  encoding = "src/contracts/libraries/CheqBase64Encoding.sol:CheqBase64Encoding"
  datatypes = "src/contracts/libraries/DataTypes.sol:DataTypes"
  errors = "src/contracts/libraries/Errors.sol:Errors"
  events = "src/contracts/libraries/Events.sol:Events"
  library_paths = [encoding, datatypes, errors, events]
  lib_addresses = []
  for library_path in library_paths:
    name = library_path.split(":")[-1]
    if not existing_addresses[chain][name]:
      result = eth_call(f'forge create {library_path} {rpc_key_flags}', "Library deployment failed")
      address = extract_address(result.stdout)
      existing_addresses[chain][name] = str(address)
    else:
      address = existing_addresses[chain][name]
      print(f"{name} library: {address}")
    lib_addresses.append(library_path + ":" + address)
  libraries_flag = f"--libraries {' '.join(lib_addresses)}"

  # Deploy the CheqRegistrar
  if not existing_addresses[chain]["registrar"]:
    registar_path = "src/contracts/CheqRegistrar.sol:CheqRegistrar"; con_args = "(0,0,0,0)" #{"writeBPS": 0, "transferBPS": 0, "fundBPS": 0, "cashBPS": 0}
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
    
  # Deploy the DirectPayRules
  rules_path = "src/contracts/rules/DirectPayRules.sol:DirectPayRules"
  result = eth_call(f'forge create {rules_path} {rpc_key_flags}', "Direct Pay rules failed")
  rules = extract_address(result.stdout)
  print("Rule address: ", rules)

  # # Whitelist the rules
  eth_call(f'cast send {registrar} "whitelistRule(address,bool)" {rules} "true" {rpc_key_flags}', "Whitelist failed")

  # Deploy the DirectPay module
  if not existing_addresses[chain]["directPay"]:
    DirectPay_path = "src/contracts/modules/DirectPay.sol:DirectPay"
    result = eth_call(f'forge create {DirectPay_path} --constructor-args {registrar} {rules} {rules} {rules} {rules} {rules} {con_args} "https://cheq-nft.s3-us-west-2.amazonaws.com/" {rpc_key_flags}', "Module deployement failed")
    direct_pay = extract_address(result.stdout)
    existing_addresses[chain]["directPay"] = direct_pay
    print(f'DirectPay address: {direct_pay}')
  else:
    direct_pay = existing_addresses[chain]["directPay"]

  # Update the address JSON
  with open("contractAddresses.json", 'w') as f:
    f.write(json.dumps(existing_addresses))

  # Whitelist the DirectPay module
  eth_call(f'cast send {registrar} "whitelistModule(address,bool,bool)" {direct_pay} "false" "true" {rpc_key_flags}', "Whitelist module failed")

  # Whitelist tokens
  for token in tokens:
    eth_call(f'cast send {registrar} "whitelistToken(address,bool)" {token} "true" {rpc_key_flags}', "Whitelist token failed")
