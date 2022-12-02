import { Box, Center } from "@chakra-ui/react";
import MyCheqsView from "./MyCheqsView";
import NewInvoice from "./NewInvoice";
import RecentContacts from "./RecentContacts";
import Reputation from "./Reputation";

function HomeScreen() {
  return (
    <Center alignItems={"flex-start"} width="100%" maxWidth="60rem">
      <Center flexDirection={"column"} width="100%" px={5}>
        <NewInvoice />
        <br />
        <MyCheqsView />
      </Center>
    </Center>
  );
}

export default HomeScreen;
