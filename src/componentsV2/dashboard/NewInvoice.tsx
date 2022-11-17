import { AddIcon } from "@chakra-ui/icons";
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
  const {
    isOpen: isInvoiceOpen,
    onOpen: onInvoiceOpen,
    onClose: onInvoiceClose,
  } = useDisclosure();
  const {
    isOpen: isCheqOpen,
    onOpen: onCheqOpen,
    onClose: onCheqClose,
  } = useDisclosure();

  return (
    <Box width="100%" mx={10}>
      <Center>
        <ButtonGroup gap="4">
          <Button
            w="200px"
            onClick={onCheqOpen}
            colorScheme="blue"
            size="lg"
            borderRadius={"20px"}
          >
            <Text fontWeight={400} fontSize={"4xl"}>
              Send
            </Text>
          </Button>
          <Button
            w="200px"
            onClick={onInvoiceOpen}
            colorScheme="blue"
            size="lg"
            borderRadius={"20px"}
          >
            <Text fontWeight={400} fontSize={"4xl"}>
              Request
            </Text>
          </Button>
        </ButtonGroup>

        <NewCheqModal
          isOpen={isCheqOpen}
          onClose={onCheqClose}
          isInvoice={false}
        />
        <NewCheqModal
          isOpen={isInvoiceOpen}
          onClose={onInvoiceClose}
          isInvoice
        />
      </Center>
    </Box>
  );
}

export default NewInvoice;
