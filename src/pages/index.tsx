import { useState } from "react";
import { Heading, Stack, Text, Center } from "@chakra-ui/react";

import Nav from "../components/Nav";
import UserFlow from "../components/flows/UserFlow";
import AuditorFlow from "../components/flows/AuditorFlow";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import HomeScreen from "../componentsV2/dashboard/HomeScreen";

function HomePage() {
  const blockchainState = useBlockchainData();
  const [isUser, setIsUser] = useState(true);

  return (
    <>
      <Nav setIsUser={setIsUser} isUser={isUser} />
      <Center my={4} py={4}>
        <Stack width="100%">
          <Center>
            <HomeScreen />
          </Center>
        </Stack>
      </Center>
      {/* {isUser ? <UserFlow /> : <AuditorFlow />} */}
    </>
  );
}

export default HomePage;
