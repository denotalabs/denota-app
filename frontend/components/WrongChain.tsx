import { Button, Center, Text } from "@chakra-ui/react";
import { MUMBAI_ADDRESS } from "../context/chainInfo";
import { switchNetwork } from "../context/SwitchNetwork";

const switchToMumbai = async () => {
  await switchNetwork(MUMBAI_ADDRESS);
};

export function WrongChain() {
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
