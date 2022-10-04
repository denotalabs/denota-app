// import { fromEntries } from "@chakra-ui/utils"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { WriteCheque, 
  Cash,
  Void,
  Transfer,
  ShakeAuditor,
  ShakeUser } from "../subgraph/generated/Cheq/Cheq"  // Events to import
import { Token,
  ERC20,
  Account,
  Handshake } from "../subgraph/generated/schema"  // Entities that contain the event info

function saveNewAccount(account: string): Account{
  let newAccount = new Account(account)
  newAccount.numTokensOwned = BigInt.fromI32(0)
  newAccount.numTokensSent = BigInt.fromI32(0)
  newAccount.numTokensAuditing = BigInt.fromI32(0)
  newAccount.numTokensReceived = BigInt.fromI32(0)
  newAccount.numAuditorsRequested = BigInt.fromI32(0)
  newAccount.numUsersRequested = BigInt.fromI32(0)
  newAccount.save()
  return newAccount
}

export function handleWrite(event: WriteCheque): void {
  // Load event parameters
  let tokenId = event.params.tokenId.toHexString()
  let amount = event.params.amount
  let expiry = event.params.expiry
  let erc20 = event.params.token.toHexString()
  let drawer = event.params.drawer.toHexString()
  let recipient = event.params.recipient.toHexString()
  let auditor = event.params.auditor.toHexString()

  // Load entities if they exist, else create them
  let ERC20Token = ERC20.load(erc20)
  let drawingAccount = Account.load(drawer)
  let receivingAccount = Account.load(recipient)
  let auditingAccount = Account.load(auditor)

  if (ERC20Token==null){
    ERC20Token = new ERC20(erc20)
    ERC20Token.save()
  }
  drawingAccount = drawingAccount==null ? saveNewAccount(drawer) : drawingAccount
  receivingAccount = receivingAccount==null ? saveNewAccount(recipient) : receivingAccount
  auditingAccount = auditingAccount==null ? saveNewAccount(auditor) : auditingAccount

  // Create new Token
  let token = new Token(tokenId)
  token.createdAt = event.block.timestamp
  token.status = BigInt.fromI32(0)
  token.transactionHash = event.block.hash.toHexString()
  token.amount = amount
  token.expiry = expiry
  token.ercToken = ERC20Token.id
  token.drawer = drawingAccount.id
  token.owner = receivingAccount.id
  token.recipient = receivingAccount.id
  token.auditor = auditingAccount.id
  token.save()

  // Increment each Account's token counts
  drawingAccount.numTokensSent = drawingAccount.numTokensSent.plus(BigInt.fromI32(1))
  // drawingAccount.tokensSent.concat(token.id)
  drawingAccount.save()
  receivingAccount.numTokensReceived = receivingAccount.numTokensReceived.plus(BigInt.fromI32(1))
  // receivingAccount.tokensReceived.concat(token.id)
  receivingAccount.numTokensOwned = receivingAccount.numTokensOwned.plus(BigInt.fromI32(1))
  // receivingAccount.tokensOwned.concat(token.id)
  receivingAccount.save()
  auditingAccount.numTokensAuditing = auditingAccount.numTokensAuditing.plus(BigInt.fromI32(1))
  // auditingAccount.tokensAuditing.concat(token.id)
  auditingAccount.save()
}

export function handleTransfer(event: Transfer): void {
  let from = event.params.from.toHexString()
  let to = event.params.to.toHexString()
  let tokenId = event.params.tokenId.toHexString()

  // Load from and to Accounts
  let fromAccount = Account.load(from)
  let toAccount = Account.load(to)
  let token = Token.load(tokenId)  // Write event fires before Transfer event: token should exist??
  if (token==null){  // SHOULDN'T BE THE CASE?
    token = new Token(tokenId)
    token.save()
  }
  toAccount = toAccount==null ? saveNewAccount(to) : toAccount
  toAccount.numTokensOwned = toAccount.numTokensOwned.plus(BigInt.fromI32(1))
  // toAccount.tokensOwned.concat(token.id)
  toAccount.save()

  if (from!="0x0000000000000000000000000000000000000000"){  // Decrement from Account's token ownership and increment to's
    fromAccount = fromAccount==null ? saveNewAccount(from) : fromAccount
    // for (let i=0; i<fromAccount.tokensOwned.length; i++){  // TODO INEFFICIENT
    //   if (fromAccount.tokensOwned[i]==tokenId){
    //     delete fromAccount.tokensOwned[i]
    //   }
    // }
    fromAccount.numTokensOwned = fromAccount.numTokensSent.minus(BigInt.fromI32(1))
    fromAccount.save()
  }
}

export function handleCash(event: Cash): void {
  let token = Token.load(event.params.tokenId.toHexString())
  let ownerAccount = Account.load(event.params.bearer.toHexString())
  ownerAccount = ownerAccount==null ? saveNewAccount(event.params.bearer.toHexString()) : ownerAccount
  if (token!=null){
    token.status = BigInt.fromI32(1)
    ownerAccount.tokensCashed = ownerAccount.tokensCashed.concat([token.id])
    ownerAccount.numTokensCashed = ownerAccount.numTokensCashed.plus(BigInt.fromI32(1))
    token.save()
    ownerAccount.save()
  } else{ // SHOULDN'T HAPPEN?
  }
}

export function handleVoid(event: Void): void {
  let token = Token.load(event.params.tokenId.toHexString())
  let ownerAccount = Account.load(event.params.bearer.toHexString())
  ownerAccount = ownerAccount==null ? saveNewAccount(event.params.bearer.toHexString()) : ownerAccount
  if (token!=null){
    token.status = BigInt.fromI32(2)
    ownerAccount.tokensVoided = ownerAccount.tokensVoided.concat([token.id])
    ownerAccount.numTokensVoided = ownerAccount.numTokensVoided.plus(BigInt.fromI32(1))
    let auditorAccount = Account.load(token.auditor)
    if (auditorAccount!=null){  // Add token to list of tokens they've voided
      auditorAccount.numVoidedTokens.plus(BigInt.fromI32(1))
      auditorAccount.voidedTokens = auditorAccount.voidedTokens.concat([token.id])
      auditorAccount.save()
    }
    token.save()
    ownerAccount.save()
  }
  else{
    // SHOULDN'T HAPPEN?
  }
}

export function handleShakeAuditor(event: ShakeAuditor): void {
  let userAccount = Account.load(event.params.user.toHexString())
  userAccount = userAccount==null ? saveNewAccount(event.params.user.toHexString()) : userAccount
  let auditorAccount = Account.load(event.params.auditor.toHexString())
  auditorAccount = auditorAccount==null ? saveNewAccount(event.params.auditor.toHexString()) : auditorAccount

  let handshake = Handshake.load(auditorAccount.id+userAccount.id)
  if (handshake!=null){  // A request started already, update it
    handshake.userShake = event.params.accepted
    if (event.params.accepted){
      handshake.userLastShake = event.block.timestamp
    }
    if (handshake.userShake && handshake.auditorShake){
      handshake.completed = true
      handshake.lastCompleted = event.block.timestamp
    }
    handshake.save()
  } else {  // User initiated handshake
    handshake = new Handshake(auditorAccount.id+userAccount.id)

    handshake.userAccount = userAccount.id
    handshake.userShake = event.params.accepted
    handshake.userLastShake = event.params.accepted ? event.block.timestamp : BigInt.fromI32(0)

    handshake.auditorAccount = auditorAccount.id
    handshake.auditorShake = false
    handshake.auditorLastShake = BigInt.fromI32(0)

    handshake.completed = false
    handshake.lastCompleted = BigInt.fromI32(0)

    handshake.save()
  }
}

export function handleShakeUser(event: ShakeUser): void {
  let auditorAccount = Account.load(event.params.auditor.toHexString())
  auditorAccount = auditorAccount==null ? saveNewAccount(event.params.auditor.toHexString()) : auditorAccount
  let userAccount = Account.load(event.params.user.toHexString())
  userAccount = userAccount==null ? saveNewAccount(event.params.user.toHexString()) : userAccount

  let handshake = Handshake.load(auditorAccount.id+userAccount.id)
  if (handshake!=null){  // A request started already, update it
    handshake.auditorShake = event.params.accepted
    if (event.params.accepted){
      handshake.auditorLastShake = event.block.timestamp
    }
    if (handshake.userShake && handshake.auditorShake){
      handshake.completed = true
      handshake.lastCompleted = event.block.timestamp
    }
    handshake.save()

  } else {  // Auditor initiated handshake
    handshake = new Handshake(auditorAccount.id+userAccount.id)

    handshake.userAccount = userAccount.id
    handshake.userShake = false 
    handshake.userLastShake = BigInt.fromI32(0)

    handshake.auditorAccount = auditorAccount.id
    handshake.auditorShake = event.params.accepted
    handshake.auditorLastShake = event.params.accepted ? event.block.timestamp : BigInt.fromI32(0)

    handshake.completed = false
    handshake.lastCompleted = BigInt.fromI32(0)

    handshake.save()
  }
}