// import { fetchERC20, fetchERC20Balance, fetchERC20Approval } from "@openzeppelin/subgraphs/src/fetch/erc20"
import { BigInt } from "@graphprotocol/graph-ts";
import {
  Cashed as CashedEvent,
  Funded as FundedEvent,
  ModuleWhitelisted,
  Transfer as TransferEvent,
  Written as WrittenEvent
} from "../subgraph/generated/CheqRegistrar/CheqRegistrar"; // Events to import
import {
  SelfSignedCheqReleased as SelfSignedReleasedEvent,
  SelfSignedCheqWritten as SelfSignedWritenEvent
} from "../subgraph/generated/DirectPay/DirectPay";
import {
  Account,
  Cheq,
  ERC20,
  Escrow,
  SelfSignedCheqData,
  Transaction
} from "../subgraph/generated/schema"; // Entities that contain the event info

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
  // Load event parameters
  const cheqId = event.params.cheqId.toString();
  const owner = event.params.owner.toHexString();
  const cheq = event.params.cheq;  // This should be pulled as a tuple
  console.log(cheq, typeof cheq);
  const directAmount = event.params.directAmount.toHex();
  const bytesData = event.params.data.toHexString();
  const cheqFee = event.params.cheqFee.toHex();
  const moduleFee = event.params.moduleFee.toHex();
  const erc20 = cheq.currency.toHexString();
  const amount = cheq.amount.divDecimal(BigInt.fromI32(18).toBigDecimal());;
  const escrowed = cheq.escrowed;
  const drawer = cheq.drawer.toHexString();
  const recipient = cheq.recipient.toHexString();
  const module = cheq.module.toHexString();
  const mintTimestamp = cheq.mintTimestamp.toHexString();
  const timestamp = cheq.timestamp.toHexString();
  const transactionHexHash = event.transaction.hash.toHex();

  // Load entities if they exist, else create them
  let drawingAccount = Account.load(drawer);
  let receivingAccount = Account.load(recipient);
  let owningAccount = Account.load(owner);
  let ERC20Token = ERC20.load(erc20);
  if (ERC20Token == null) {
    ERC20Token = new ERC20(erc20);
    // Query it's symbol and decimals here?
    ERC20Token.save();
  }
  drawingAccount =
    drawingAccount == null ? saveNewAccount(drawer) : drawingAccount;
  receivingAccount =
    receivingAccount == null ? saveNewAccount(recipient) : receivingAccount;
  owningAccount = owningAccount == null ? saveNewAccount(owner) : owningAccount;

  const newCheq = new Cheq(cheqId);

  cheq.createdAt = timestamp;
  cheq.erc20 = ERC20Token.id;
  cheq.amount = amount.divDecimal(BigInt.fromI32(18).toBigDecimal());
  cheq.amountExact = amount;
  cheq.drawer = drawingAccount.id;
  cheq.recipient = receivingAccount.id;
  cheq.module = module;
  cheq.uri = ""; // TODO Add URI here
  cheq.escrowed = escrowed.divDecimal(BigInt.fromI32(18).toBigDecimal());
  cheq.escrowedExact = escrowed;
  cheq.owner = owningAccount.id; // TODO inefficient to add ownership info on Transfer(address(0), to, cheqId) event?
  cheq.save();

  const escrow = new Escrow(transactionHexHash + "/" + cheqId); // How OZ does IDs entities that implements Event?
  escrow.emitter = drawingAccount.id;
  escrow.cheq = event.params.cheqId.toString();
  escrow.timestamp = event.block.timestamp;
  escrow.from = drawingAccount.id; // TODO Shouldnt this depend on module?
  escrow.amount = event.params.escrowed;
  escrow.transaction = transactionHexHash; // TODO How OZ does it, how does it work?
  // transaction.events.concat(event)  // TODO How does OZ do this? Need to add TransferEvent & FundedEvent
  escrow.save();

  const transaction = saveTransaction(
    transactionHexHash,
    cheqId,
    event.block.timestamp,
    event.block.number
  );
}

// export function handleModule(event: MemoWritten): void {
// TODO Let modules emit their own events and update them from there
// let module = fetchModule(module)
// Module.numCheqsManaged = Module.numCheqsManaged.plus(BigInt.fromI32(1))
// Module.save()
// // Increment each Account's token counts
// drawingAccount.numCheqsSent = drawingAccount.numCheqsSent.plus(BigInt.fromI32(1))
// drawingAccount.save()
// // Increment each Account's token counts
// receivingAccount.numCheqsReceived = receivingAccount.numCheqsReceived.plus(BigInt.fromI32(1))
// receivingAccount.save()
// }


// TODO: Transfer event being fired before write event is causing problems
export function handleTransfer(event: TransferEvent): void {
  // // Load event params
  // const from = event.params.from.toHexString();
  // const to = event.params.to.toHexString();
  // const cheqId = event.params.tokenId.toHexString();
  // const transactionHexHash = event.transaction.hash.toHex();
  // // Load from and to Accounts
  // let fromAccount = Account.load(from); // Check if from is address(0) since this represents mint()
  // let toAccount = Account.load(to);
  // fromAccount = fromAccount == null ? saveNewAccount(from) : fromAccount;
  // toAccount = toAccount == null ? saveNewAccount(to) : toAccount;
  // // Load Cheq
  // let cheq = Cheq.load(cheqId); // Write event fires before Transfer event: cheq should exist
  // if (cheq == null) {
  //   // SHOULDN'T BE THE CASE
  //   cheq = new Cheq(cheqId);
  //   cheq.save();
  // }
  // // Update accounts' cheq balances
  // if (event.params.from != Address.zero()) {
  //   fromAccount.numCheqsOwned = fromAccount.numCheqsSent.minus(
  //     BigInt.fromI32(1)
  //   );
  //   fromAccount.save();
  // }
  // toAccount.numCheqsOwned = toAccount.numCheqsOwned.plus(BigInt.fromI32(1));
  // toAccount.save();
  // const transaction = saveTransaction(
  //   transactionHexHash,
  //   cheqId,
  //   event.block.timestamp,
  //   event.block.number
  // );
  // const transfer = new Transfer(transactionHexHash + "/" + cheqId);
  // transfer.emitter = fromAccount.id;
  // transfer.transaction = transactionHexHash;
  // transfer.timestamp = event.block.timestamp;
  // transfer.cheq = cheqId;
  // transfer.from = fromAccount.id;
  // transfer.to = toAccount.id;
  // transfer.save();
}

export function handleFund(event: FundedEvent): void {
  // Save in Escrow table
  // Load event params
  let fromAccount = Account.load(event.params.from.toHexString());
  fromAccount =
    fromAccount == null
      ? saveNewAccount(event.params.from.toHexString())
      : fromAccount;
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

export function handleWhitelist(event: ModuleWhitelisted): void {
  const module = event.params.module;
  const isAccepted = event.params.isAccepted;
  const moduleName = event.params.moduleName;
}

export function handleSelfSignedCheq(event: SelfSignedWritenEvent): void {
  const cheqId = event.params.cheqId.toString();
  const funder = event.params.funder.toHexString();
  const inspectionPeriod = event.params.inspectionPeriod;

  const selfSigned = new SelfSignedCheqData("selfsigned/" + cheqId);
  selfSigned.cheqFunder = funder;
  selfSigned.isEarlyReleased = false;
  selfSigned.cheqInspectionPeriod = inspectionPeriod;
  selfSigned.save();

  const cheq = Cheq.load(cheqId);
  if (cheq) {
    cheq.selfSignedData = "selfsigned/" + cheqId;
    cheq.save();
  }
}

export function handleSelfSignedReleased(event: SelfSignedReleasedEvent): void {
  const cheqId = event.params.cheqId.toString();
  const selfSigned = SelfSignedCheqData.load("selfsigned/" + cheqId);
  if (selfSigned) {
    selfSigned.isEarlyReleased = true;
    selfSigned.save();
  }
}



// function write(DataTypes.Cheq calldata cheq, address owner, uint256 directAmount, bytes calldata moduleWriteData) external payable returns (uint256);
// // function transferFrom(address from, address to, uint256 tokenId, bytes memory moduleTransferData) external; // Question: Should this be allowed?
// function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory moduleTransferData) external;
// function fund(uint256 cheqId, uint256 amount, uint256 directAmount, bytes calldata fundData) external payable;
// function cash(uint256 cheqId, uint256 amount, address to, bytes calldata cashData) external payable;
// function approve(address to, uint256 tokenId) external;

// function cheqInfo(uint256 cheqId) external view returns (DataTypes.Cheq memory);  // Question: Should this be the only _cheqInfo view method?
// function cheqDrawerRecipient(uint256 cheqId) external view returns(address, address);
// function cheqCurrencyValueEscrow(uint256 cheqId) external view returns(address, uint256, uint256);
// function cheqDrawer(uint256 cheqId) external view returns (address);
// function cheqRecipient(uint256 cheqId) external view returns (address);
// function cheqCurrency(uint256 cheqId) external view returns (address);
// function cheqAmount(uint256 cheqId) external view returns (uint256);
// function cheqEscrowed(uint256 cheqId) external view returns (uint256);
// function cheqModule(uint256 cheqId) external view returns (address);
// // function totalSupply() public view returns (uint256);

// function ruleWhitelisted(address rule) external view returns (bool);
// function rulesWhitelisted(address writeRule, address transferRule, address fundRule, address cashRule, address approveRule) external view returns (bool);
// function moduleWhitelisted(address module) external view returns(bool, bool);  // addressWhitelisted, bytecodeWhitelisted
// function tokenWhitelisted(address token) external view returns(bool);

// function getFees() external view returns(uint256, uint256, uint256, uint256);
// function getTotalFees(uint256 cheqId, uint8 _WTFC) external view returns(uint256, uint256);
// function moduleWithdraw(address token, uint256 amount, address payoutAccount) external;
