import { Center, Spinner } from "@chakra-ui/react";
import WriteCheqFlow from "../../components/write/WriteCheqFlow";
import { WrongChain } from "../../components/WrongChain";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

function SendPage() {
  const { isInitializing, isWrongChain } = useBlockchainData();

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
  return (
    <Center w="100%" h="100%">
      <WriteCheqFlow isInvoice={true} />
    </Center>
  );
}

export default SendPage;
