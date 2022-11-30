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
import CurrencyIcon, { CheqCurrency } from "../designSystem/CurrencyIcon";
import DetailsModal from "./details/DetailsModal";
import ApproveAndPayModal from "./pay/ApproveAndPayModal";

export type CheqStatus = "cashed" | "voided" | "pending" | "cashable";

interface Props {
  sender: string;
  status: CheqStatus;
  token: CheqCurrency;
  amount: string;
}

const STATUS_COLOR_MAP = {
  cashed: "blue.900",
  cashable: "green.900",
  voided: "gray.600",
  pending: "purple.900",
};

function CheqCardV2({ sender, amount, token, status }: Props) {
  const {
    isOpen: isDetailsOpen,
    onOpen: onOpenDetails,
    onClose: onCloseDetails,
  } = useDisclosure();

  const {
    isOpen: isPayOpen,
    onOpen: onOpenPay,
    onClose: onClosePay,
  } = useDisclosure();

  return (
    <GridItem
      w="100%"
      h="180"
      bg={STATUS_COLOR_MAP[status]}
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

            <CurrencyIcon currency={token} />
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
                  onClick={onOpenPay}
                >
                  Pay
                </Button>
              ) : null}
              <Button
                w="min(40vw, 100px)"
                borderRadius={5}
                colorScheme="teal"
                onClick={onOpenDetails}
              >
                Details
              </Button>
            </ButtonGroup>
          </Center>
        </VStack>
      </VStack>
      <DetailsModal isOpen={isDetailsOpen} onClose={onCloseDetails} />
      <ApproveAndPayModal isOpen={isPayOpen} onClose={onClosePay} />
    </GridItem>
  );
}

export default CheqCardV2;
