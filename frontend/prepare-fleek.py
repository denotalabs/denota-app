import os

with open('package.json', 'r') as file :
  filedata = file.read()

filedata = filedata.replace('"@graphprotocol/graph-ts": "^0.22.1",', '')

with open('package.json', 'w') as file:
  file.write(filedata)

os.remove("src/graph/subgraph/mapping.ts")

