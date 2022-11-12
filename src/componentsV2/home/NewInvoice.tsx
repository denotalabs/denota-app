import { AddIcon } from "@chakra-ui/icons";
import { Box, Button, Center, Text } from "@chakra-ui/react";

function NewInvoice() {
  return (
    <Box width='100%' mx={10}>
      <Center>
        <Button leftIcon={<AddIcon />} colorScheme='blue' size='lg'>
          <Text fontWeight={400} fontSize={"4xl"}>
            New Invoice
          </Text>{" "}
        </Button>
      </Center>
    </Box>
  );
}

export default NewInvoice;
