import shlex, subprocess, sys, json

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

  for (key, value) in existing_addresses[chain].items():
    if not value:
      raise f"{key} contract not deployed"

  registrar = existing_addresses[chain]["registrar"]
  directPay = existing_addresses[chain]["directPay"]
  dai = existing_addresses[chain]["dai"]
  weth = existing_addresses[chain]["weth"]

  # Create cheqs
  # TODO create for loop with random values. Write using multiple modules
  cheq = {"currency": dai,
          "amount": 100e18,
          "escrowed": 10e18,
          "drawer": address1,
          "recipient": address2,
          "module": directPay,
          "mintTimestamp": 0}.values()
  owner = address2
  directAmount = 0
  moduleBytesData = ""
  args = ' '.join([cheq, owner, directAmount, moduleBytesData]) # TODO might need to stringify
  eth_call(f'cast send {registrar} "write(address,bool)" {args} {rpc_key_flags}', "Write failed")
  # Transfer
  # Fund
  # Cash
