import { useEffect, useState } from "react";
import { Heading, Stack, Text } from "@chakra-ui/react";

import useBlockchainData from "../hooks/useBlockchainData";

import Nav from "../components/Nav";
import CheqCard from "../components/CheqCard";
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
      <Stack>
        <Heading>Welcome to Cheq.</Heading>
        <Text>Total cheqs written: {blockchainState.cheqBalance}</Text>
        <Text>Total weth deposited: {blockchainState.wethBalance}</Text>
        <Text>Total dai deposited: {blockchainState.daiBalance}</Text>
      </Stack>
      <CheqCard />
      {isUser ? (
        <UserFlow blockchainState={blockchainState} />
      ) : (
        <AuditorFlow blockchainState={blockchainState} />
      )}
    </>
  );
}

export default HomePage;
