import { Center, Flex, Spinner } from "@chakra-ui/react";
import { WrongChain } from "../../components/WrongChain";
import WriteNotaFlow from "../../components/write/WriteNotaFlow";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

function SendPage() {
  const { isInitializing, isWrongChain, blockchainState } = useBlockchainData();

  if (isInitializing) {
    return (
      <Center flexDirection={"column"} w="100%" flex="1" px={5}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isWrongChain) {
    return (
      <Center w="100%" flex="1">
        <WrongChain />
      </Center>
    );
  }

  return (
    <Flex
      w="100%"
      flex="1"
      justify="center"
      align={{ base: "stretch", md: "flex-start" }}
      pt={{ base: 0, md: 4 }}
      pb={{ base: 0, md: 6 }}
    >
      <WriteNotaFlow />
    </Flex>
  );
}

export default SendPage;
