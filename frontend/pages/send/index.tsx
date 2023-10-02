import { Center } from "@chakra-ui/react";
import { TransactionCoverageFlow } from "../../components/onramps/transactions/TransactionCoverageFlow";
import ProtectedPage from "../../components/ProtectedPage";

function SendPage() {
  return (
    <ProtectedPage>
      <Center w="100%" h="100%">
        <TransactionCoverageFlow />
      </Center>
    </ProtectedPage>
  );
}

export default SendPage;
