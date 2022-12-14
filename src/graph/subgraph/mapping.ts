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

function saveNewAccount(account: string): Account{
  let newAccount = new Account(account)
  newAccount.save()
  return newAccount
}

function saveTransaction(
  transactionHexHash: string, 
  cheqId: string, 
  timestamp: BigInt, 
  blockNumber: BigInt
  ): Transaction {
  // TODO not sure if the ID structure is best
  let transaction = Transaction.load(transactionHexHash + '/' + cheqId)  // OZ Uses this entity, what to use as its ID?
  if (transaction == null) {
    transaction = new Transaction(transactionHexHash)
    transaction.timestamp = timestamp
    transaction.blockNumber = blockNumber
    transaction.transactionHash = transactionHexHash
    transaction.save()
  }
  return transaction
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
  let owner = event.params.owner.toHexString()
  let transactionHexHash = event.transaction.hash.toHex()

  // Load entities if they exist, else create them
  let drawingAccount = Account.load(drawer)
  let receivingAccount = Account.load(recipient)
  let owningAccount = Account.load(owner)
  let ERC20Token = ERC20.load(erc20)
  if (ERC20Token==null) {
    ERC20Token = new ERC20(erc20)
    ERC20Token.save()
  }
  drawingAccount = drawingAccount == null ? saveNewAccount(drawer) : drawingAccount
  receivingAccount = receivingAccount == null ? saveNewAccount(recipient) : receivingAccount
  owningAccount = owningAccount == null ? saveNewAccount(owner) : owningAccount

  let cheq = new Cheq(cheqId)
  cheq.createdAt = event.block.timestamp
  cheq.erc20 = ERC20Token.id
  cheq.amount = amount.divDecimal(BigInt.fromI32(18).toBigDecimal())  // TODO save the erc20's decimals by querying it instead of assuming
  cheq.amountExact = amount
  cheq.drawer = drawingAccount.id
  cheq.recipient = receivingAccount.id
  cheq.broker = broker
  cheq.uri = ""  // TODO Add URI here
  cheq.escrowed = escrowed.divDecimal(BigInt.fromI32(18).toBigDecimal())
  cheq.escrowedExact = escrowed
  cheq.owner = owningAccount.id // TODO inefficient to add ownership info on Transfer(address(0), to, cheqId) event?
  cheq.save()

  let escrow = new Escrow(transactionHexHash + '/' + cheqId)  // How OZ does IDs entities that implements Event?
  escrow.emitter = drawingAccount.id
  escrow.cheq = event.params.cheqId.toString()
  escrow.timestamp = event.block.timestamp
  escrow.from = drawingAccount.id  // TODO Shouldnt this depend on module?
  escrow.amount = event.params.escrowed
  escrow.transaction = transactionHexHash  // TODO How OZ does it, how does it work?
  // transaction.events.concat(event)  // TODO How does OZ do this? Need to add TransferEvent & FundedEvent

  let transaction = saveTransaction(transactionHexHash, cheqId, event.block.timestamp, event.block.number)

  // TODO Let modules emit their own events and update them from there
  // let brokerModule = fetchModule(broker)
  // brokerModule.numCheqsManaged = brokerModule.numCheqsManaged.plus(BigInt.fromI32(1))
  // brokerModule.save()
  // // Increment each Account's token counts
  // drawingAccount.numCheqsSent = drawingAccount.numCheqsSent.plus(BigInt.fromI32(1))
  // drawingAccount.save()
  // // Increment each Account's token counts
  // receivingAccount.numCheqsReceived = receivingAccount.numCheqsReceived.plus(BigInt.fromI32(1))
  // receivingAccount.save()
}

export function handleTransfer(event: TransferEvent): void { 
  // Load event params
  let from = event.params.from.toHexString()
  let to = event.params.to.toHexString()
  let cheqId = event.params.tokenId.toHexString()
  let transactionHexHash = event.transaction.hash.toHex()

  // Load from and to Accounts
  let fromAccount = Account.load(from)  // Check if from is address(0) since this represents mint()
  let toAccount = Account.load(to)
  fromAccount = fromAccount == null ? saveNewAccount(from) : fromAccount
  toAccount = toAccount == null ? saveNewAccount(to) : toAccount

  // Load Cheq
  let cheq = Cheq.load(cheqId)  // Write event fires before Transfer event: cheq should exist
  if (cheq == null){  // SHOULDN'T BE THE CASE
    cheq = new Cheq(cheqId)
    cheq.save()
  }

  // Update accounts' cheq balances
  if (event.params.from != Address.zero()){ 
    fromAccount.numCheqsOwned = fromAccount.numCheqsSent.minus(BigInt.fromI32(1))
    fromAccount.save()
  }
  toAccount.numCheqsOwned = toAccount.numCheqsOwned.plus(BigInt.fromI32(1))
  toAccount.save()

  let transaction = saveTransaction(transactionHexHash, cheqId, event.block.timestamp, event.block.number)

  let transfer = new Transfer(transactionHexHash + '/' + cheqId)
  transfer.emitter = fromAccount.id
  transfer.transaction = transactionHexHash
  transfer.timestamp = event.block.timestamp
  transfer.cheq = cheqId
  transfer.from = fromAccount.id
  transfer.to = toAccount.id
  transfer.save()
}

export function handleFund(event: FundedEvent): void {  // Save in Escrow table
  // Load event params
  let fromAccount = Account.load(event.params.from.toHexString())
  fromAccount = fromAccount == null ? saveNewAccount(event.params.from.toHexString()) : fromAccount
  let amount = event.params.amount
  let transactionHexHash = event.transaction.hash.toHex()
  let cheqId = event.params.cheqId.toString()

  // Load cheq
  let cheq = Cheq.load(cheqId)
  if (cheq == null){  // SHOULDN'T BE THE CASE
    cheq = new Cheq(cheqId)
    cheq.save()
  }
  let transaction = saveTransaction(transactionHexHash, cheqId, event.block.timestamp, event.block.number)

  let escrow = new Escrow(transactionHexHash + '/' + cheqId)
  escrow.emitter = fromAccount.id
  escrow.transaction = transactionHexHash
  escrow.timestamp = event.block.timestamp
  escrow.cheq = cheqId
  escrow.from = fromAccount.id
  escrow.amount = amount
}

export function handleCash(event: CashedEvent): void {
    // Load event params
    let toAccount = Account.load(event.params.to.toHexString())
    toAccount = toAccount == null ? saveNewAccount(event.params.to.toHexString()) : toAccount
    let amount = event.params.amount
    let transactionHexHash = event.transaction.hash.toHex()
    let cheqId = event.params.cheqId.toString()
  
    // Load cheq
    let cheq = Cheq.load(cheqId)
    if (cheq == null){  // SHOULDN'T BE THE CASE
      cheq = new Cheq(cheqId)
      cheq.save()
    }

    // Load transaction
    let transaction = saveTransaction(transactionHexHash, cheqId, event.block.timestamp, event.block.number)
  
    let escrow = new Escrow(transactionHexHash + '/' + cheqId)
    escrow.emitter = toAccount.id
    escrow.transaction = transactionHexHash
    escrow.timestamp = event.block.timestamp
    escrow.cheq = cheqId
    escrow.from = toAccount.id
    escrow.amount = amount.neg()  // TODO may need more general differentiation of Cashing/Funding
}

// export function handleWhitelist(event: BrokerWhitelisted): void {
//   let broker = event.params.broker
//   let isAccepted = event.params.isAccepted
//   let brokerName = event.params.brokerName
// }

// // let loadSSTL = (moduleAddress: string) => {
// //   let brokerModule = SelfSignTimeLock.load(moduleAddress)
// //     if (brokerModule == null){
// //       brokerModule = new SelfSignTimeLock(moduleAddress)
// //       brokerModule.save()
// //     }
// //     return brokerModule
// // }
// // let moduleSwitch = {"SelfSignTimeLock": loadSSTL}

// function fetchModule(moduleAddress: string) : SelfSignTimeLock {
//   let brokerRegistration = BrokerRegistry.load(moduleAddress)  // How to fetch correct broker module?
//   if (brokerRegistration==null){
//     brokerRegistration = new BrokerRegistry(moduleAddress)
//     brokerRegistration.save()
//   }
//   // Replace string with brokerRegistration.name
//   // let brokerModule = moduleSwitch["SelfSignTimeLock"](brokerRegistration.module)
//   let brokerModule = SelfSignTimeLock.load(brokerRegistration.module)
//     if (brokerModule == null){
//       brokerModule = new SelfSignTimeLock(moduleAddress)
//       brokerModule.save()
//     }
//   return brokerModule
//   // if (moduleAddress == "SelfSignTimeLock") {
//   //   let brokerModule = SelfSignTimeLock.load(brokerRegistration.module)
//   //   if (brokerModule == null){
//   //     brokerModule = new SelfSignTimeLock(moduleAddress)
//   //     brokerModule.save()
//   //   }
//   //   return SelfSignTimeLock
//   // } else if (moduleAddress == "Bank") {
//   // } else {
//   // }
// }
// function updateModule() : void {
//   // cheqsManaged: [Cheq!]! @derivedFrom(field: "broker")
//   // numCheqsManaged: BigInt!
//   // cheqFunder: Account!
//   // cheqReceiver: Account!
//   // cheqCreated: BigInt!  # Is redundant?
//   // cheqInspectionPeriod: BigInt!
//   // isEarlyReleased: Boolean!
//   // earlyReleasedTime: BigInt
//   // cheqWhitelist: [ERC20!]!
// }
