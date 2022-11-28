import {
  Button,
  ButtonGroup,
  Center,
  Flex,
  GridItem,
  HStack,
  Text,
  VStack,
  Image,
  useDisclosure,
} from "@chakra-ui/react";
import DetailsModal from "./details/DetailsModal";

interface Props {
  sender: string;
  status: string;
  token: string;
  amount: string;
}

const colorForStatus = (status: string) => {
  switch (status) {
    case "cashed":
      return "blue.900";
    case "cashable":
      return "green.900";
    case "voided":
      return "gray.600";
    case "pending":
      return "purple.900";
    default:
      return "gray.600";
  }
};

function CheqCardV2({ sender, amount, token, status }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <GridItem
      w="100%"
      h="180"
      bg={colorForStatus(status)}
      p={3}
      borderRadius={20}
    >
      <VStack alignItems="flex-start" justifyContent="space-between" h="100%">
        <Flex alignItems="flex-start" flexDirection="column">
          <Text fontWeight={600} fontSize={"xl"}>
            {sender}
          </Text>
          <HStack>
            <Text fontWeight={400} fontSize={"xl"} my={0}>
              {amount} {token}
            </Text>

            {token === "USDC" ? (
              <Image
                borderRadius="full"
                boxSize="20px"
                src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=023"
                alt="USDC"
              />
            ) : (
              <Image
                borderRadius="full"
                boxSize="20px"
                src="https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png?v=023"
                alt="DAI"
              />
            )}
          </HStack>
        </Flex>

        <VStack alignItems="flex-start" w="100%">
          <Text fontWeight={400} fontSize={"xl"}>
            {"Status: "}
            {status}
          </Text>
          <Center w="100%">
            <ButtonGroup gap="4">
              {status === "cashable" ? (
                <Button
                  w="min(40vw, 100px)"
                  borderRadius={5}
                  colorScheme="teal"
                >
                  Cash
                </Button>
              ) : null}
              {status === "pending" ? (
                <Button
                  w="min(40vw, 100px)"
                  borderRadius={5}
                  colorScheme="teal"
                >
                  Pay
                </Button>
              ) : null}
              <Button
                w="min(40vw, 100px)"
                borderRadius={5}
                colorScheme="teal"
                onClick={onOpen}
              >
                Details
              </Button>
            </ButtonGroup>
          </Center>
        </VStack>
      </VStack>
      <DetailsModal isOpen={isOpen} onClose={onClose} />
    </GridItem>
  );
}

export default CheqCardV2;
