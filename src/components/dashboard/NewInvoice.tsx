import {
  Box,
  Button,
  ButtonGroup,
  Center,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
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
            fontSize="2xl"
            borderRadius={5}
          >
            Pay
          </Button>
          <Button
            bg="brand.100"
            color="brand.200"
            w="min(40vw, 200px)"
            onClick={() => {
              setIsInvoice(true);
              onOpen();
            }}
            fontSize="2xl"
            size="lg"
            borderRadius={5}
          >
            Request
          </Button>
        </ButtonGroup>

        <NewCheqModal isOpen={isOpen} onClose={onClose} isInvoice={isInvoice} />
      </Center>
    </Box>
  );
}

export default NewInvoice;
