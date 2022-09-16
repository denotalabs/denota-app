import { BigInt, Address } from "@graphprotocol/graph-ts"
import { Cheq,
         Void, AcceptUser, AcceptAuditor, Cash, WriteCheque } from "../generated/Cheq/Cheq"  // Events to import
import { Sender, Cheque } from "../generated/schema"  // Entities that contain the events

export function handleWriteCheque(event: WriteCheque): void {
  // drawer, auditor, chequeID, recipient
  let senderString = event.params.drawer.toHexString()
  let sender = Sender.load(senderString)

  if (sender == null) {
    sender = new Sender(senderString)
    sender.address = event.params.drawer
    sender.createdAt = event.block.timestamp
    sender.chequeCount = BigInt.fromI32(1)
  }
  else {
    sender.chequeCount = sender.chequeCount.plus(BigInt.fromI32(1))
  }

  let cheque = new Cheque(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  // id: ID!
  // sender: Sender!
  // createdAt: BigInt!
  // transactionHash: String!
  cheque.sender = senderString
  cheque.createdAt = event.block.timestamp
  cheque.transactionHash = event.transaction.hash.toHex()

  cheque.save()
  sender.save()

}
