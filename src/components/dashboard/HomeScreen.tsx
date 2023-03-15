import { useEffect, useState } from "react";

import { Center, Spinner, useDisclosure } from "@chakra-ui/react";
import Cookies from "js-cookie";

import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { MUMBAI_ADDRESS } from "../../context/chainInfo";
import { switchNetwork } from "../../context/SwitchNetwork";
import NewUserModal from "../nux/NewUserModal";
import { WrongChain } from "../WrongChain";
import MyCheqsView from "./MyCheqsView";
import NewUserScreen from "./NewUserScreen";

function HomeScreen() {
  return (
    <Center alignItems={"flex-start"} width="100%" maxWidth="65rem">
      <HomeScreenContent />
    </Center>
  );
}

const switchToMumbai = async () => {
  await switchNetwork(MUMBAI_ADDRESS);
};

function HomeScreenContent() {
  const { blockchainState, isInitializing, isWrongChain } = useBlockchainData();
  const [hasShownNux, setHasShownNux] = useState(false);
  const { account } = blockchainState;
  const {
    isOpen: isNuxOpen,
    onOpen: onOpenNux,
    onClose: onCloseNux,
  } = useDisclosure();

  useEffect(() => {
    if (!isInitializing && account && !Cookies.get(account) && !hasShownNux) {
      setHasShownNux(true);
      onOpenNux();
    }
  }, [account, hasShownNux, isInitializing, isNuxOpen, onOpenNux]);

  if (isInitializing) {
    return (
      <Center flexDirection={"column"} w="100%" px={5}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isWrongChain) {
    return <WrongChain />;
  }

  return account === "" ? (
    <NewUserScreen />
  ) : (
    <Center flexDirection={"column"} width="100%" p={{ base: "4", lg: "0" }}>
      <NewUserModal isOpen={isNuxOpen} onClose={onCloseNux} />
      <br />
      <MyCheqsView />
    </Center>
  );
}

export default HomeScreen;
