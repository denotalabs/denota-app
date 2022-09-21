import { Card } from "react-bootstrap";

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
    // <form key={index}
    //   onSubmit={(e) => {
    //     e.preventDefault();
    //     blockchainState.cheq?.cashCheque(chequeArray[0]);
    //   }}
    // >
    //   <div className="form-group">
    //     <Card
    //       key={chequeArray[0]}  // ID
    //       className="mt-3"
    //       bg={chequeArray[2]}
    //       text={"white"}
    //     >
    //       <Card.Header className="py-1">
    //         <div className="float-left">Cheque ID: #{chequeArray[0]}</div>
    //         <div className="float-right" color="grey">
    //           {chequeArray[3]}
    //         </div>
    //       </Card.Header>
    //       <Card.Body className="py-1">
    //         Signer: {chequeArray[1].drawer.slice(2, 10)}...<br></br>
    //         Recipient: {chequeArray[1].recipient.slice(2, 10)}...<br></br>
    //         {/* Owner: {chequeArray[1].bearer.slice(2, 10)}...<br></br> */}
    //         Auditor: {chequeArray[1].auditor.slice(2, 10)}...<br></br>
    //         Amount: {ethers.utils
    //           .formatEther(chequeArray[1].amount)
    //           .toString()}{" "}
    //         Ether<br></br>
    //         {/* Maturation Date: {chequeArray[1].expiry.toNumber()}<br></br> */}
    //       </Card.Body>
    //       <Card.Header className="p-0 m-0">
    //         <div className="">
    //           <button type="submit" className="btn btn-dark float-left col-6">
    //             Cash Cheque
    //           </button>
    //           <button className="btn btn-danger float-right col-6">
    //             Dispute
    //           </button>
    //         </div>
    //       </Card.Header>
    //     </Card>
    //   </div>
    // </form>
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
