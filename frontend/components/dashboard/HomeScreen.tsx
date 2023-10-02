import { Center } from "@chakra-ui/react";

import ProtectedPage from "../ProtectedPage";
import MyNotas from "./MyNotas";

function HomeScreen() {
  return (
    <ProtectedPage>
      <Center alignItems={"flex-start"} width="100%" maxWidth="80rem">
        <Center flexDirection={"column"} width="100%">
          <MyNotas />
        </Center>
      </Center>
    </ProtectedPage>
  );
}

export default HomeScreen;
