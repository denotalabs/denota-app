import { fromEntries } from "@chakra-ui/utils"
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
  RequestAuditor,
  RequestUser,
  Handshake } from "../subgraph/generated/schema"  // Entities that contain the events

export function handleTransfer(event: Transfer): void {  // SHOULD THIS ONLY BE FOR TRANSFERS NOT WRITES?
  let from = event.params.from.toHexString()
  let to = event.params.to.toHexString()
  let tokenId = event.params.tokenId

  let fromAccount = Account.load(from)
  let toAccount = Account.load(to)
  let auditorAccount = Account.load(from)

  if (from=="0x0000000000000000000000000000000000000000"){  // New cheq
    let token = new Token(tokenId.toHexString())
    token.tokenID = tokenId
    token.mintTime = event.block.timestamp

    /*
    amount: BigInt!
    expiry: BigInt!
    item_Id: BigInt!
    status: BigInt!
    transactionHash: String!
    owner: Account!
    drawer: Account!
    recipient: Account!
    auditor: Account!
  */
    token.save()

  } else{
    let token = Token.load(tokenId.toHexString())
    if (token!==null){
      token.owner = to
    } else{

    }
  }
  // If transfer was from the null address, create a new token
  // If transfer was not, load token, change ownership

  // let sender = Account.load(senderString)
  // if (sender == null) {
  //   sender = new Account(senderString)
  //   sender.address = event.params.drawer
  //   sender.createdAt = event.block.timestamp
  //   sender.chequeCount = BigInt.fromI32(1)
  // }
  // else {
  //   sender.chequeCount = sender.chequeCount.plus(BigInt.fromI32(1))
  // }

  // sender.save()
}

export function handleCash(event: Cash): void {}

export function handleVoid(event: Void): void {}

export function handleShakeAuditor(event: ShakeAuditor): void {}

export function handleShakeUser(event: ShakeUser): void {}


