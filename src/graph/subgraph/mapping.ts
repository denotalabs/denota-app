// import { fetchERC20, fetchERC20Balance, fetchERC20Approval } from "@openzeppelin/subgraphs/src/fetch/erc20"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { Written as WrittenEvent, 
         Transfer as TransferEvent, 
         Funded as FundedEvent,
         Cashed as CashedEvent,
         BrokerWhitelisted } from "../subgraph/generated/CRX/CRX"  // Events to import
import { ERC20,
         Transaction,
         Escrow,
         Transfer,
         Account,
         Cheq,
         SelfSignTimeLock, 
         BrokerRegistry } from "../subgraph/generated/schema"  // Entities that contain the event info
import {
        decimals,
        events,
        transactions,
        } from '@amxx/graphprotocol-utils'

function saveNewAccount(account: string): Account{
  let newAccount = new Account(account)
  newAccount.save()
  return newAccount
}

export function handleWrite(event: WrittenEvent): void {
  // Load event parameters
  let cheqId = event.params.cheqId.toString()
  let erc20 = event.params.token.toHexString()
  let amount = event.params.amount
  let escrowed = event.params.escrowed
  let drawer = event.params.drawer.toHexString()
  let recipient = event.params.recipient.toHexString()
  let broker = event.params.broker.toHexString()

  // Load entities if they exist, else create them
  let drawingAccount = Account.load(drawer)
  let receivingAccount = Account.load(recipient)
  let ERC20Token = ERC20.load(erc20)
  if (ERC20Token==null){
    ERC20Token = new ERC20(erc20)
    ERC20Token.save()
  }
  drawingAccount = drawingAccount == null ? saveNewAccount(drawer) : drawingAccount
  receivingAccount = receivingAccount == null ? saveNewAccount(recipient) : receivingAccount

  let newEscrow = new Escrow(events.id(event))  // How OZ does IDs entities that implements Event
  newEscrow.cheq = event.params.cheqId.toString()
  newEscrow.timestamp = event.block.timestamp
  newEscrow.from = escrowed == BigInt.zero() ? receivingAccount.id : drawingAccount.id  // Shouldnt this depend on module?
  newEscrow.amount = event.params.escrowed
  newEscrow.transaction = transactions.log(event).id

  // Create new cheq
  let cheq = new Cheq(cheqId)
  cheq.createdAt = event.block.timestamp
  // cheq.transactionHash = event.block.hash.toHexString()
  // cheq.ercToken = ERC20Token.id
  cheq.amount = amount
  cheq.escrowed = escrowed
  cheq.drawer = drawingAccount.id
  // token.owner = receivingAccount.id // TODO inefficient to add ownership info on Transfer(address(0), to, cheqId) event?
  cheq.recipient = receivingAccount.id
  cheq.broker = broker
  cheq.save()

  let brokerRegistration = BrokerRegistry.load(broker)  // How to fetch correct broker module?
  if (brokerRegistration==null){
    brokerRegistration = new BrokerRegistry(broker)
    brokerRegistration.save()
  }
  // Increment broker's token count
  let brokerModule = SelfSignTimeLock.load(brokerRegistration.module)
  if (brokerModule == null){
    brokerModule = new SelfSignTimeLock(broker)
    brokerModule.save()
  }
  brokerModule.numCheqsManaged = brokerModule.numCheqsManaged.plus(BigInt.fromI32(1))
  brokerModule.save()
  // Increment each Account's token counts
  drawingAccount.numCheqsSent = drawingAccount.numCheqsSent.plus(BigInt.fromI32(1))
  drawingAccount.save()
  // Increment each Account's token counts
  receivingAccount.numCheqsReceived = receivingAccount.numCheqsReceived.plus(BigInt.fromI32(1))
  receivingAccount.save()
}

export function handleTransfer(event: TransferEvent): void {  // Need to save all transfer events in Transfer table  
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

export function handleFund(event: FundedEvent): void {  // Save in Escrow table
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

export function handleCash(event: CashedEvent): void {
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
export function handleWhitelist(event: BrokerWhitelisted): void {
  let broker = event.params.broker
  let isAccepted = event.params.isAccepted
  let brokerName = event.params.brokerName
}