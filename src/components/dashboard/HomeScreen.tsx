import { Button, Center, Spinner, Text, useDisclosure } from "@chakra-ui/react";
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

const switchToMumbai = async () => {
  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }], // chainId must be in hexadecimal numbers
    });
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x13881",
              chainName: "Matic Mumbai Testnet",
              nativeCurrency: {
                name: "Matic",
                symbol: "MATIC",
                decimals: 18,
              },
              blockExplorerUrls: ["https://mumbai.polygonscan.com"],
              rpcUrls: ["https://matic-mumbai.chainstacklabs.com/"],
            },
          ],
        });
      } catch (addError) {
        console.error(addError);
      }
    }
  }
};

function HomeScreenContent() {
  const { blockchainState, isInitializing, isWrongChain } = useBlockchainData();
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

  return blockchainState.account === "" ? (
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
