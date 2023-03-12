import { Center } from "@chakra-ui/react";
import WriteCheqFlow from "../../components/write/WriteCheqFlow";

function SendPage() {
  return (
    <Center w="100%" h="100%">
      <WriteCheqFlow isInvoice={true} />

      {/* <VStack w="650px" bg="brand.100" py={2} px={4} borderRadius="30px">
      </VStack> */}
    </Center>
  );
}

export default SendPage;
