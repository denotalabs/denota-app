import CheqCard from "../components/CheqCard";
import { useBlockchainData } from "../context/BlockchainDataProvider";

function CashTab() {
  const blockchainState = useBlockchainData();

  // Cheque States: Mature: green, Pending: yellow, Voided: red
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
