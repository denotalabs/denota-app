import { Center, VStack } from "@chakra-ui/react";
import WriteCheqFlow from "../../components/write/WriteCheqFlow";

function SendPage() {
  return (
    <Center w="100%">
      <VStack w="650px" bg="brand.100" py={2} px={4} borderRadius="30px">
        <WriteCheqFlow isInvoice={true} />
      </VStack>
    </Center>
  );
}

export default SendPage;
