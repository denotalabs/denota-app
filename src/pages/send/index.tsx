import { Center } from "@chakra-ui/react";
import WriteCheqFlow from "../../components/write/WriteCheqFlow";

function SendPage() {
  return (
    <Center w="100%" h="100%">
      <WriteCheqFlow isInvoice={true} />
    </Center>
  );
}

export default SendPage;
