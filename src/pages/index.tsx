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
  const [isV2, setIsV2] = useState(true);
  const v1Flow = isUser ? <UserFlow /> : <AuditorFlow />;

  return (
    <>
      <Nav
        setIsUser={setIsUser}
        isUser={isUser}
        setIsV2={setIsV2}
        isV2={isV2}
      />
      <Center my={4} py={4}>
        <Stack width="100%">
          <Center>{isV2 ? <HomeScreen /> : null}</Center>
        </Stack>
      </Center>
      {isV2 ? null : v1Flow}
    </>
  );
}

export default HomePage;
