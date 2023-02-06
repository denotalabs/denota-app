import { useState } from "react";

import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import NewCheqModal from "../write/NewCheqModal";

function NewInvoice() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [isInvoice, setIsInvoice] = useState(false);

  return (
    <Box width="100%" mx={10}>
      <Center>
        <ButtonGroup gap="4">
          <Button
            bg="brand.100"
            color="brand.200"
            w="min(40vw, 200px)"
            onClick={() => {
              setIsInvoice(false);
              onOpen();
            }}
            size="lg"
            borderRadius={5}
          >
            <Text fontWeight={400} fontSize={"4xl"}>
              Pay
            </Text>
          </Button>
          <Button
            bg="brand.100"
            color="brand.200"
            w="min(40vw, 200px)"
            onClick={() => {
              setIsInvoice(true);
              onOpen();
            }}
            size="lg"
            borderRadius={5}
          >
            <Text fontWeight={400} fontSize={"4xl"}>
              Request
            </Text>
          </Button>
        </ButtonGroup>

        <NewCheqModal isOpen={isOpen} onClose={onClose} isInvoice={isInvoice} />
      </Center>
    </Box>
  );
}

export default NewInvoice;
