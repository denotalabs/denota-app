import { Center, Spinner } from "@chakra-ui/react";
import { WrongChain } from "../../components/WrongChain";
import NewUserScreen from "../../components/dashboard/NewUserScreen";
import WriteNotaFlow from "../../components/write/WriteNotaFlow";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

function SendPage() {
  const { isInitializing, isWrongChain, blockchainState } = useBlockchainData();
  const { account } = blockchainState;

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
    <Center w="100%" h="100%">
      <WriteNotaFlow />
    </Center>
  );
}

export default SendPage;
