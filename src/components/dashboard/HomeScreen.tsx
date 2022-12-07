import { Center, Spinner } from "@chakra-ui/react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import ConnectWallet from "./ConnectWallet";
import MyCheqsView from "./MyCheqsView";
import NewInvoice from "./NewInvoice";

function HomeScreen() {
  return (
    <Center alignItems={"flex-start"} width="100%" maxWidth="60rem">
      <HomeScreenContent />
    </Center>
  );
}

function HomeScreenContent() {
  const { blockchainState, isInitializing } = useBlockchainData();

  if (isInitializing) {
    return (
      <Center flexDirection={"column"} w="100%" px={5}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return blockchainState.account === "" ? (
    <ConnectWallet />
  ) : (
    <Center flexDirection={"column"} width="100%" px={5}>
      <NewInvoice />
      <br />
      <MyCheqsView />
    </Center>
  );
}

export default HomeScreen;
