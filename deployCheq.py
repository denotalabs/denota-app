import shlex, subprocess, re, sys

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
  key = sys.argv[1]
  rpc = "https://matic-mumbai.chainstacklabs.com"# if (sys.argv[2] == "mumbai") else "http://127.0.0.1:8545"
  rpc_key_flags = f"--private-key {key} --rpc-url {rpc} --gas-price 30gwei"
  
  # Deploy libraries
  encoding_path = "src/contracts/libraries/CheqBase64Encoding.sol:CheqBase64Encoding"
  datatypes_path = "src/contracts/libraries/DataTypes.sol:DataTypes"
  errors_path = "src/contracts/libraries/Errors.sol:Errors"
  events_path = "src/contracts/libraries/Events.sol:Events"
  library_paths = [encoding_path, datatypes_path, errors_path, events_path]
  lib_addresses = []
  for library_path in library_paths:
    result = eth_call(f'forge create {library_path} {rpc_key_flags}', "Library deployment failed")
    lib_addresses.append(library_path + ":" + extract_address(result.stdout))
  libraries_flag = f"--libraries {' '.join(lib_addresses)}"

  # # Deploy the CheqRegistrar
  # registar_path = "src/contracts/CheqRegistrar.sol:CheqRegistrar"; con_args = "(0,0,0,0)" #{"writeBPS": 0, "transferBPS": 0, "fundBPS": 0, "cashBPS": 0}
  # result = eth_call(f'forge create {registar_path} --constructor-args {con_args} {rpc_key_flags}', "Registrar deployment failed")
  registrar = "0x0C5B27CC5595eC1AAf720A538A6490c5aF6FaD64"# extract_address(result.stdout)
  # print(f'Registrar address: {registrar}')

  # # Deploy ERC20s for testing
  # erc20_path = "src/test/mock/erc20.sol:TestERC20"
  # tokens = []
  # for (supply, name, symbol) in [(10000000000000000000000000, "wrapped eth", "WETH"), (10000000000000000000000000, "dai", "DAI")]:
  #   result = eth_call(f'forge create {erc20_path} --constructor-args {supply} {name} {symbol} {rpc_key_flags}', "ERC20 deployment failed")
  #   token = extract_address(result.stdout)
  #   tokens.append(token)
  #   print(f'{symbol} address: {token}')
  
  # # Deploy the DirectPayRules
  # rules_path = "src/contracts/rules/DirectPayRules.sol:DirectPayRules"
  # result = eth_call(f'forge create {rules_path} {rpc_key_flags}', "Direct Pay rules failed")
  # rules = extract_address(result.stdout)

  # # Whitelist the rules
  # eth_call(f'cast send {registrar} "whitelistRule(address,bool)" {rules} "true" {rpc_key_flags}', "Whitelist failed")

  # # Deploy the DirectPay module
  # DirectPay_path = "src/contracts/modules/DirectPay.sol:DirectPay"
  # result = eth_call(f'forge create {DirectPay_path} --constructor-args {registrar} {rules} {rules} {rules} {rules} {rules} {con_args} "https://cheq-nft.s3-us-west-2.amazonaws.com/" {rpc_key_flags}', "Module deployement failed")
  direct_pay = "0x378e0262ec639668D0c81d9e0e3D22c861e65968"#extract_address(result.stdout)
  # print(f'DirectPay address: {direct_pay}')

  # Whitelist the DirectPay module
  eth_call(f'cast send {registrar} "whitelistModule(address,bool,bool)" {direct_pay} "false" "true" {rpc_key_flags}', "Whitelist module failed")

  # Whitelist tokens
  for token in ["0xc5B6c09dc6595Eb949739f7Cd6A8d542C2aabF4b", "0xe37F99b03C7B4f4d71eE20e8eF3AC4E138D47F80"]:#tokens:
    eth_call(f'cast send {registrar} "whitelistToken(address,bool)" {token} "true" {rpc_key_flags}', "Whitelist token failed")