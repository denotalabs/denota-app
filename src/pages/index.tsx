import { useEffect, useState } from "react";
import { Heading, Stack, Text, Center } from "@chakra-ui/react";

import useBlockchainData from "../hooks/useBlockchainData";

import Nav from "../components/Nav";
import UserFlow from "../components/flows/UserFlow";
import AuditorFlow from "../components/flows/AuditorFlow";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";

const APIURL = "http://localhost:8000/subgraphs/name/Cheq/Cheq";
const tokensQuery = `
  query {
    tokens {
      id
      createdAt
      amount
      expiry
      ercToken
      status
      transactionHash
      owner
      drawer
      recipient
      auditor
    }
  }
`;
const client = new ApolloClient({
  uri: APIURL,
  cache: new InMemoryCache(),
});
client
  .query({
    query: gql(tokensQuery),
  })
  .then((data) => console.log("Subgraph data: ", data))
  .catch((err) => {
    console.log("Error fetching data: ", err);
  });

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
              A liquid escrow protocol
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
