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
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box width="100%" mx={10}>
      <Center>
        <ButtonGroup gap="4">
          <Button
            w="200px"
            onClick={onOpen}
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
            onClick={onOpen}
            colorScheme="blue"
            size="lg"
            borderRadius={"20px"}
          >
            <Text fontWeight={400} fontSize={"4xl"}>
              Request
            </Text>
          </Button>
        </ButtonGroup>

        <NewCheqModal isOpen={isOpen} onClose={onClose} />
      </Center>
    </Box>
  );
}

export default NewInvoice;
