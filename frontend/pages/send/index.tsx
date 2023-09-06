import { Center, Spinner } from "@chakra-ui/react";
import NewUserScreen from "../../components/dashboard/NewUserScreen";
import { TransactionCoverageFlow } from "../../components/onramps/transactions/TransactionCoverageFlow";
import { WrongChain } from "../../components/WrongChain";
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
      <TransactionCoverageFlow />{" "}
    </Center>
  );
}

export default SendPage;
