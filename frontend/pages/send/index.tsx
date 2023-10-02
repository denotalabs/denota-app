import { Center } from "@chakra-ui/react";
import { TransactionCoverageFlow } from "../../components/onramps/transactions/TransactionCoverageFlow";

function SendPage() {
  return (
    <Center w="100%" h="100%">
      <TransactionCoverageFlow />
    </Center>
  );
}

export default SendPage;
