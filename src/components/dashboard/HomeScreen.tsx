import { Center, Spinner, useDisclosure } from "@chakra-ui/react";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import NewUserModal from "../nux/NewUserModal";
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
  const [hasShownNux, setHasShownNux] = useState(false);

  const {
    isOpen: isNuxOpen,
    onOpen: onOpenNux,
    onClose: onCloseNux,
  } = useDisclosure();

  useEffect(() => {
    if (
      !isInitializing &&
      blockchainState.account &&
      !Cookies.get(blockchainState.account) &&
      !hasShownNux
    ) {
      setHasShownNux(true);
      onOpenNux();
    }
  }, [
    blockchainState.account,
    hasShownNux,
    isInitializing,
    isNuxOpen,
    onOpenNux,
  ]);

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
    <Center flexDirection={"column"} width="100%" p={{ md: "0", lg: "4" }}>
      <NewUserModal isOpen={isNuxOpen} onClose={onCloseNux} />
      <NewInvoice />
      <br />
      <MyCheqsView />
    </Center>
  );
}

export default HomeScreen;
