import sys
import json

file = sys.argv[1]

with open(file) as f:
    address = json.load(f)["deployedTo"]

print(address)