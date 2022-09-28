import { useEffect, useState } from "react";
import { Heading, Stack, Text, Center } from "@chakra-ui/react";

import Nav from "../components/Nav";
import UserFlow from "../components/flows/UserFlow";
import AuditorFlow from "../components/flows/AuditorFlow";
import { useBlockchainData } from "../context/BlockchainDataProvider";

function HomePage() {
  const blockchainState = useBlockchainData();
  const [isUser, setIsUser] = useState(true);

  return (
    <>
      <Nav />
      <Center my={4} py={4}>
        <Stack>
          <Heading>Welcome to Cheq</Heading>
          <Center>
            <Heading as="h3" size="md">
              A liquid escrow protocol
            </Heading>
          </Center>
          <Center>
            <Text>Total cheqs written: {blockchainState.cheqTotalSupply}</Text>
          </Center>
        </Stack>
      </Center>

      {isUser ? (
        <UserFlow />
      ) : (
        <AuditorFlow blockchainState={blockchainState} />
      )}
    </>
  );
}

export default HomePage;
