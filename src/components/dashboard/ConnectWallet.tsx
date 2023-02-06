import { Box, Button, Center } from "@chakra-ui/react";

import { useBlockchainData } from "../../context/BlockchainDataProvider";

function ConnectWallet() {
  const { connectWallet } = useBlockchainData();

  return (
    <Box w="100%">
      <Center flexDirection={"column"} w="100%" px={5}>
        <Button
          colorScheme="blue"
          onClick={() => {
            connectWallet?.();
          }}
        >
          Connect Wallet
        </Button>
      </Center>
    </Box>
  );
}

export default ConnectWallet;
