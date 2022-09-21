import type { BlockchainData } from "../hooks/useBlockchainData";
import CheqCard from "../components/CheqCard";
interface Props {
  blockchainState: BlockchainData;
}
function CashTab({ blockchainState }: Props) {
  // Cheque States: Mature: green, Pending: yellow, Voided: red
  console.log(blockchainState.userCheques);
  const userCheques = blockchainState.userCheques.map((chequeArray, index) => (
    <CheqCard
      key={index}
      blockchainState={blockchainState}
      cheqArrayState={chequeArray}
    />
  ));
  return (
    <div>
      You have {blockchainState.userChequeCount} cheq(s):
      <br></br>
      <br></br>
      {userCheques}
    </div>
  );
}

export default CashTab;
