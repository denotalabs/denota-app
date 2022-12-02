// import { fromEntries } from "@chakra-ui/utils"
import { BigInt } from "@graphprotocol/graph-ts"
import { Written, Transfer, Funded, Cashed } from "../subgraph/generated/CRX/CRX"  // Events to import
import { Token, Ownership, Escrow, ERC20, Account, Broker} from "../subgraph/generated/schema"  // Entities that contain the event info

function saveNewAccount(account: string): Account{
  let newAccount = new Account(account)
  newAccount.save()
  return newAccount
}

export function handleWrite(event: Written): void {
  // Load event parameters
  let tokenId = event.params.cheqId.toHexString()
  let erc20 = event.params.token.toHexString()
  let amount = event.params.amount
  let escrowed = event.params.escrowed
  let drawer = event.params.drawer.toHexString()
  let recipient = event.params.recipient.toHexString()
  let broker = event.params.broker.toHexString()

  // Load entities if they exist, else create them
  let ERC20Token = ERC20.load(erc20)
  let brokerModule = Broker.load(broker)
  let drawingAccount = Account.load(drawer)
  let receivingAccount = Account.load(recipient)

  if (ERC20Token==null){
    ERC20Token = new ERC20(erc20)
    ERC20Token.save()
  }
  if (brokerModule==null){
    brokerModule = new Broker(broker)
    brokerModule.save()
  }
  drawingAccount = drawingAccount == null ? saveNewAccount(drawer) : drawingAccount
  receivingAccount = receivingAccount == null ? saveNewAccount(recipient) : receivingAccount

  // Create new cheq
  let token = new Token(tokenId)
  token.createdAt = event.block.timestamp
  token.transactionHash = event.block.hash.toHexString()
  token.ercToken = ERC20Token.id
  token.amount = amount
  token.escrowed = escrowed
  token.drawer = drawingAccount.id
  // token.owner = receivingAccount.id // TODO inefficient to add ownership info on Transfer(address(0), to, cheqId) event?
  token.recipient = receivingAccount.id
  token.broker = broker
  token.save()

  // Increment broker's token count
  brokerModule.numTokensManaged = brokerModule.numTokensManaged.plus(BigInt.fromI32(1))
  brokerModule.save()
  // Increment each Account's token counts
  drawingAccount.numTokensSent = drawingAccount.numTokensSent.plus(BigInt.fromI32(1))
  drawingAccount.save()
  // Increment each Account's token counts
  receivingAccount.numTokensReceived = receivingAccount.numTokensReceived.plus(BigInt.fromI32(1))
  receivingAccount.save()

  let newEscrow = new Escrow(event.block.timestamp.toString())
  newEscrow.caller = escrowed == BigInt.zero() ? receivingAccount.id : drawingAccount.id
  newEscrow.tokenId = event.params.cheqId
  newEscrow.amount = event.params.escrowed
}

export function handleTransfer(event: Transfer): void {  // Need to save all transfer events in Transfer table  
  let from = event.params.from.toHexString()
  let to = event.params.to.toHexString()
  let tokenId = event.params.tokenId.toHexString()

  // Load from and to Accounts
  let fromAccount = Account.load(from)  // Check if from is address(0) since this represents mint()
  let toAccount = Account.load(to)
  let token = Token.load(tokenId)  // Write event fires before Transfer event: token should exist??
  if (token == null){  // SHOULDN'T BE THE CASE?
    token = new Token(tokenId)
    token.save()
  }
  toAccount = toAccount == null ? saveNewAccount(to) : toAccount
  toAccount.numTokensOwned = toAccount.numTokensOwned.plus(BigInt.fromI32(1))
  toAccount.save()

  fromAccount = fromAccount == null ? saveNewAccount(from) : fromAccount 
  if (from != "0x0000000000000000000000000000000000000000"){  // If minting, don't subtract from address(0)'s tokens owned
    // Decrement from Account's token ownership and increment to's
    fromAccount.numTokensOwned = fromAccount.numTokensSent.minus(BigInt.fromI32(1))
  }
  fromAccount.save()

  let newOwnership = new Ownership(event.block.timestamp.toString())
  newOwnership.tokenId = BigInt.fromI32(0)
  newOwnership.from = fromAccount.id
  newOwnership.to = toAccount.id
  newOwnership.save()
}

export function handleFund(event: Funded): void {  // Save in Escrow table
  let token = Token.load(event.params.cheqId.toHexString())
  let fromAccount = Account.load(event.params.from.toHexString())
  let amount = event.params.amount

  fromAccount = fromAccount==null ? saveNewAccount(event.params.from.toHexString()) : fromAccount
  if (token!=null){
  //   ownerAccount.tokensCashed = ownerAccount.tokensCashed.concat([token.id])
  //   ownerAccount.numTokensCashed = ownerAccount.numTokensCashed.plus(BigInt.fromI32(1))
  //   token.save()
  //   ownerAccount.save()
  } else{ // SHOULDN'T HAPPEN?
  }

  let newEscrow = new Escrow(event.block.timestamp.toString())
  newEscrow.caller = fromAccount.id
  newEscrow.tokenId = event.params.cheqId
  newEscrow.amount = amount
}

export function handleCash(event: Cashed): void {
  let token = Token.load(event.params.cheqId.toHexString())
  let ownerAccount = Account.load(event.params.to.toHexString())
  ownerAccount = ownerAccount==null ? saveNewAccount(event.params.to.toHexString()) : ownerAccount
  if (token!=null){
    token.save()
    ownerAccount.save()
  } else{ // SHOULDN'T HAPPEN?
  }

  // let newEscrow = new Escrow(event.block.timestamp.toString())
  // newEscrow.caller = escrowed == BigInt.zero() ? receivingAccount.id : drawingAccount.id
  // newEscrow.tokenId = event.params.cheqId
  // newEscrow.amount = event.params.escrowed
}