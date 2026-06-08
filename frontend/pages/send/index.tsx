import { Center, Spinner } from "@chakra-ui/react";
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
    <Center w="100%" flex="1">
      <WriteNotaFlow />
    </Center>
  );
}

export default SendPage;
