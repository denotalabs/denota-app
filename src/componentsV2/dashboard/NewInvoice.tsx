import { AddIcon } from "@chakra-ui/icons";
import { Box, Button, Center, Text, useDisclosure } from "@chakra-ui/react";
import NewCheqModel from "../write/NewCheqModel";

function NewInvoice() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box width="100%" mx={10}>
      <Center>
        <Button
          onClick={onOpen}
          leftIcon={<AddIcon />}
          colorScheme="blue"
          size="lg"
        >
          <Text fontWeight={400} fontSize={"4xl"}>
            New Invoice
          </Text>
        </Button>
        <NewCheqModel isOpen={isOpen} onClose={onClose} />
      </Center>
    </Box>
  );
}

export default NewInvoice;
