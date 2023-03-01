import { useEffect, useState } from "react";

import { Button, Center, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import Cookies from "js-cookie";

import { useBlockchainData } from "../../context/BlockchainDataProvider";
import NewUserModal from "../nux/NewUserModal";
import ConnectWallet from "./ConnectWallet";
import MyCheqsView from "./MyCheqsView";
import NewInvoice from "./NewInvoice";
import { switchNetwork } from "../../context/SwitchNetwork";
function HomeScreen() {
  return (
    <Center alignItems={"flex-start"} width="100%" maxWidth="65rem">
      <HomeScreenContent />
    </Center>
  );
}

const switchToMumbai = async () => {
  await switchNetwork("0x13881");
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
    return (
      <Center flexDirection={"column"} w="100%" px={5}>
        <Text fontWeight={600} fontSize={"xl"} textAlign="center" pb={6}>
          Wrong Chain
        </Text>
        <Text fontWeight={600} fontSize={"md"} textAlign="center" pb={6}>
          Please switch to Polygon Mumbai Testnet
        </Text>
        <Button
          colorScheme="blue"
          onClick={() => {
            switchToMumbai?.();
          }}
        >
          Switch to Mumbai
        </Button>
      </Center>
    );
  }

  return account === "" ? (
    <ConnectWallet />
  ) : (
    <Center flexDirection={"column"} width="100%" p={{ base: "4", lg: "0" }}>
      <NewUserModal isOpen={isNuxOpen} onClose={onCloseNux} />
      <NewInvoice />
      <br />
      <MyCheqsView />
    </Center>
  );
}

export default HomeScreen;
