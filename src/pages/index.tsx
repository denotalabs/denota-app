import { useEffect, useState } from "react";

import useBlockchainData from "../hooks/useBlockchainData";

import Nav from "../components/Nav";
import Card from "../components/CheqCard";
import UserFlow from "../components/flows/UserFlow";
import AuditorFlow from "../components/flows/AuditorFlow";

function HomePage() {
  const { blockchainState, loadBlockchainData } = useBlockchainData();
  const [isUser, setIsUser] = useState(true);

  useEffect(() => {
    loadBlockchainData();
  }, [loadBlockchainData]);
  return (
    <>
      <Nav blockchainState={blockchainState} />

      <br></br>
      <h1>Welcome to Cheq</h1>
      <h6>Total cheqs written: {blockchainState.cheqBalance}</h6>
      <h6>Total weth deposited: {blockchainState.wethBalance}</h6>
      <h6>Total dai deposited: {blockchainState.daiBalance}</h6>
      <br></br>
      <Card />
      {isUser ? (
        <UserFlow blockchainState={blockchainState} />
      ) : (
        <AuditorFlow blockchainState={blockchainState} />
      )}
    </>
  );
}

export default HomePage;
