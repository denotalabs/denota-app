import { Center } from "@chakra-ui/react";

import MyNotas from "./NotaDashboard";

function HomeScreen() {
  return (
    <Center alignItems={"flex-start"} width="100%" maxWidth="80rem">
      <Center flexDirection={"column"} width="100%">
        <MyNotas />
      </Center>
    </Center>
  );
}

export default HomeScreen;
