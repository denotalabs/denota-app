import shlex, subprocess, re, sys

def extract_address(input):
  try:
      return re.search('Deployed to: (.*)', input).group(1)
  except AttributeError:
      pass

if __name__ == "__main__":
  key = sys.argv[1]
  rpc = sys.argv[2]
  
  result = subprocess.run(
    shlex.split(f'forge create src/contracts/CheqRegistrar.sol:CheqRegistrar --private-key {key} --rpc-url {rpc}'), 
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
  
  if result.stderr:
    print("Registrar", result.stderr)
  registrar = extract_address(result.stdout)
  
  result = subprocess.run(
    shlex.split(f'forge create src/contracts/SelfSignTimeLock.sol:SelfSignTimeLock --private-key {key} --rpc-url {rpc} --constructor-args {registrar} --gas-price 30gwei'), 
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
  
  if result.stderr:
    print("SelfSigned", result.stderr)
  self_signed = extract_address(result.stdout)

  result = subprocess.run(
    shlex.split(f'cast send {registrar} "whitelistModule(address,bool,string)" {self_signed} "true" "SelfSigned" --private-key {key} --rpc-url {rpc} --gas-price 30gwei'), 
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

  if (result.stdout): 
    print("Success")
  else: 
    print("Cast", result.stderr)


