import { Box, Center } from "@chakra-ui/react";
import MyCheqsView from "./MyCheqsView";
import NewInvoice from "./NewInvoice";
import RecentContacts from "./RecentContacts";
import Reputation from "./Reputation";

function HomeScreen() {
  return (
    <Center alignItems={"flex-start"} width="100%" maxWidth="90rem">
      <Center flexDirection={"column"} width="70%" px={5}>
        <Reputation />
        <br />
        <MyCheqsView />
      </Center>
      <Center flexDirection={"column"} width="30%" px={5}>
        <NewInvoice />
        <br />
        <RecentContacts />
      </Center>
    </Center>
  );
}

export default HomeScreen;
