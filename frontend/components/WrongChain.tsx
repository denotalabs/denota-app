import { Button, Center, Text } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { MUMBAI_ADDRESS } from "../context/chainInfo";
import { switchNetwork } from "../context/SwitchNetwork";

export function WrongChain() {
  const [chainSwitchFailed, setChainSwitchFailed] = useState(false);

  const switchToMumbai = useCallback(async () => {
    const isSuccess = await switchNetwork(MUMBAI_ADDRESS);
    setChainSwitchFailed(!isSuccess);
  }, []);
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
        {!chainSwitchFailed
          ? "Switch to Mumbai"
          : "Seems like we can't switch the network automatically. Please check if you can change it from the wallet."}
      </Button>
    </Center>
  );
}
