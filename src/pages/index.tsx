import { useEffect, useState } from "react";
import { Heading, Stack, Text, Center } from "@chakra-ui/react";

import useBlockchainData from "../hooks/useBlockchainData";

import Nav from "../components/Nav";
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
      <Center my={4} py={4}>
        <Stack>
          <Heading>Welcome to Cheq</Heading>
          <Center>
            <Heading as="h3" size="md">
              A reversible payment protocol
            </Heading>
          </Center>
          <Center>
            <Text>Total cheqs written: {blockchainState.cheqTotalSupply}</Text>
          </Center>
        </Stack>
      </Center>

      {isUser ? (
        <UserFlow blockchainState={blockchainState} />
      ) : (
        <AuditorFlow blockchainState={blockchainState} />
      )}
    </>
  );
}

export default HomePage;
