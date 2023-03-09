// import { fetchERC20, fetchERC20Balance, fetchERC20Approval } from "@openzeppelin/subgraphs/src/fetch/erc20"
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Transfer as TransferEvent } from "../subgraph/generated/CheqRegistrar/CheqRegistrar"; // Events to import
import { Cashed as CashedEvent } from "../subgraph/generated/Events/Events"; // Events to import
import {
  Funded as FundedEvent,
  Written as WrittenEvent,
} from "../subgraph/generated/Events/Registrar";
import {
  Account,
  Cheq,
  DirectPayData,
  ERC20,
  Escrow,
  Transaction,
  Transfer,
} from "../subgraph/generated/schema"; // Entities that contain the event info

import { PaymentCreated as PaymentCreatedEvent } from "../subgraph/generated/DirectPay/DirectPay";
function saveNewAccount(account: string): Account {
  const newAccount = new Account(account);
  newAccount.save();
  return newAccount;
}

function saveTransaction(
  transactionHexHash: string,
  cheqId: string,
  // TODO figure out BigInt vs bigint literal eslint issue
  // eslint-disable-next-line @typescript-eslint/ban-types
  timestamp: BigInt,
  // eslint-disable-next-line @typescript-eslint/ban-types
  blockNumber: BigInt
): Transaction {
  // TODO not sure if the ID structure is best
  let transaction = Transaction.load(transactionHexHash + "/" + cheqId); // OZ Uses this entity, what to use as its ID?
  if (transaction == null) {
    transaction = new Transaction(transactionHexHash);
    transaction.timestamp = timestamp;
    transaction.blockNumber = blockNumber;
    transaction.transactionHash = transactionHexHash;
    transaction.save();
  }
  return transaction;
}

export function handleWrite(event: WrittenEvent): void {
  const currency = event.params.currency.toHexString();
  const owner = event.params.owner.toHexString();
  const transactionHexHash = event.transaction.hash.toHex();
  // Load entities if they exist, else create them

  let owningAccount = Account.load(owner);
  let ERC20Token = ERC20.load(currency);
  if (ERC20Token == null) {
    ERC20Token = new ERC20(currency); // Query it's symbol and decimals here?
    ERC20Token.save();
  }

  owningAccount = owningAccount == null ? saveNewAccount(owner) : owningAccount;
  const cheqId = event.params.cheqId.toString(); // let [currency, amount, escrowed, drawer, recipient, module, mintTimestamp] = event.params.cheq;
  const newCheq = new Cheq(cheqId);

  const cheqTimestamp = event.block.timestamp;
  newCheq.timestamp = cheqTimestamp;
  const cheqCreatedAt = event.block.timestamp; //BigInt.fromI32(event.block.timestamp);
  newCheq.createdAt = cheqCreatedAt;
  newCheq.erc20 = ERC20Token.id;
  newCheq.module = event.params.module.toString();
  newCheq.uri = ""; // TODO Add URI here
  const cheqEscrowed = event.params.escrowed;
  newCheq.escrowed = cheqEscrowed.divDecimal(BigInt.fromI32(18).toBigDecimal());
  newCheq.escrowedExact = cheqEscrowed; // .divDecimal(BigInt.fromI32(18).toBigDecimal());
  newCheq.owner = owningAccount.id; // TODO inefficient to add ownership info on Transfer(address(0), to, cheqId) event?
  newCheq.save();
  const escrow = new Escrow(transactionHexHash + "/" + cheqId); // How OZ does IDs entities that implements Event?
  escrow.emitter = event.transaction.from.toHexString();
  escrow.transaction = transactionHexHash; // TODO How OZ does it, how does it work?
  escrow.timestamp = event.block.timestamp;
  escrow.cheq = event.params.cheqId.toString();
  escrow.from = event.transaction.from.toHexString(); // TODO Shouldnt this depend on module?
  escrow.amount = cheqEscrowed;
  // const directCheqAmount = event.params.directAmount;
  // escrow.directAmount = directCheqAmount; //.divDecimal(BigInt.fromI32(18).toBigDecimal());
  // // escrow.directAmountExact = directAmount;
  escrow.save();
  // const transaction =
  saveTransaction(
    transactionHexHash,
    cheqId,
    event.block.timestamp,
    event.block.number
  );
}

export function handleDirectPayment(event: PaymentCreatedEvent): void {
  const sender = event.transaction.from.toHexString();
  const creditor = event.params.creditor.toHexString();
  const debtor = event.params.debtor.toHexString();
  const receiver = sender === creditor ? debtor : creditor;

  let creditorAccount = Account.load(creditor);
  let debtorAccount = Account.load(creditor);
  creditorAccount =
    creditorAccount == null ? saveNewAccount(creditor) : creditorAccount;
  debtorAccount =
    debtorAccount == null ? saveNewAccount(debtor) : debtorAccount;

  const cheqId = event.params.cheqId.toString();

  const directPay = new DirectPayData(cheqId + "/direct");
  directPay.creditor = creditorAccount.id;
  directPay.debtor = debtorAccount.id;
  directPay.save();

  const cheq = Cheq.load(cheqId);
  if (cheq != null) {
    cheq.uri = event.params.memoHash.toString();
    cheq.receiver = receiver;
    cheq.sender = sender;
    cheq.moduleData = directPay.id;
    cheq.save();
  }
}

// TODO: Transfer event being fired before write event is causing problems
export function handleTransfer(event: TransferEvent): void {
  // Load event params
  const from = event.params.from.toHexString();
  const to = event.params.to.toHexString();
  const cheqId = event.params.tokenId.toHexString();
  const transactionHexHash = event.transaction.hash.toHex();
  // Load from and to Accounts
  let fromAccount = Account.load(from); // Check if from is address(0) since this represents mint()
  let toAccount = Account.load(to);
  fromAccount = fromAccount == null ? saveNewAccount(from) : fromAccount;
  toAccount = toAccount == null ? saveNewAccount(to) : toAccount;
  // Load Cheq
  let cheq = Cheq.load(cheqId); // Write event fires before Transfer event: cheq should exist
  if (cheq == null) {
    // SHOULDN'T BE THE CASE
    cheq = new Cheq(cheqId);
    cheq.save();
  }
  // Update accounts' cheq balances
  if (event.params.from != Address.zero()) {
    fromAccount.numCheqsOwned = fromAccount.numCheqsSent.minus(
      BigInt.fromI32(1)
    );
    fromAccount.save();
  }
  toAccount.numCheqsOwned = toAccount.numCheqsOwned.plus(BigInt.fromI32(1));
  toAccount.save();
  const transaction = saveTransaction(
    transactionHexHash,
    cheqId,
    event.block.timestamp,
    event.block.number
  );
  const transfer = new Transfer(transactionHexHash + "/" + cheqId);
  transfer.emitter = fromAccount.id;
  transfer.transaction = transactionHexHash;
  transfer.timestamp = event.block.timestamp;
  transfer.cheq = cheqId;
  transfer.from = fromAccount.id;
  transfer.to = toAccount.id;
  transfer.save();
}

export function handleFund(event: FundedEvent): void {
  // Load event params
  let fromAccount = Account.load(event.params.funder.toHexString());
  fromAccount =
    fromAccount == null
      ? saveNewAccount(event.params.funder.toHexString())
      : fromAccount;
  const amount = event.params.amount;
  // const directAmount = event.params.directAmount;
  const transactionHexHash = event.transaction.hash.toHex();
  const cheqId = event.params.cheqId.toString();

  // Load cheq
  let cheq = Cheq.load(cheqId);
  if (cheq == null) {
    // SHOULDN NEVER BE THE CASE
    cheq = new Cheq(cheqId);
    cheq.save();
  }
  const transaction = saveTransaction(
    transactionHexHash,
    cheqId,
    event.block.timestamp,
    event.block.number
  );

  const escrow = new Escrow(transactionHexHash + "/" + cheqId);
  escrow.emitter = fromAccount.id;
  escrow.transaction = transactionHexHash;
  escrow.timestamp = event.block.timestamp;
  escrow.cheq = cheqId;
  escrow.from = fromAccount.id;
  escrow.amount = amount;
  // escrow.directAmount = directAmount;
  escrow.save();
}

export function handleCash(event: CashedEvent): void {
  // Load event params
  let toAccount = Account.load(event.params.to.toHexString());
  toAccount =
    toAccount == null
      ? saveNewAccount(event.params.to.toHexString())
      : toAccount;
  const amount = event.params.amount;
  const transactionHexHash = event.transaction.hash.toHex();
  const cheqId = event.params.cheqId.toString();

  // Load cheq
  let cheq = Cheq.load(cheqId);
  if (cheq == null) {
    // SHOULDN'T BE THE CASE
    cheq = new Cheq(cheqId);
    cheq.save();
  }

  // Load transaction
  const transaction = saveTransaction(
    transactionHexHash,
    cheqId,
    event.block.timestamp,
    event.block.number
  );

  const escrow = new Escrow(transactionHexHash + "/" + cheqId);
  escrow.emitter = toAccount.id;
  escrow.transaction = transactionHexHash;
  escrow.timestamp = event.block.timestamp;
  escrow.cheq = cheqId;
  escrow.from = toAccount.id;
  escrow.amount = amount.neg(); // TODO may need more general differentiation of Cashing/Funding
  escrow.save();
}

// export function handleWhitelist(event: ModuleWhitelisted): void {
//   const module = event.params.module;
//   const isAccepted = event.params.isAccepted;
//   // const moduleName = event.params.moduleName;
// }
