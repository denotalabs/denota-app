import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Flex,
  GridItem,
  HStack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { Cheq } from "../../hooks/useCheqs";
import CurrencyIcon from "../designSystem/CurrencyIcon";
import DetailsModal from "./details/DetailsModal";
import ApproveAndPayModal from "./pay/ApproveAndPayModal";

export type CheqStatus =
  | "pending_escrow"
  | "pending_maturity"
  | "cashed"
  | "voidable"
  | "payable"
  | "cashable"
  | "paid"
  | "voided";

export type CheqType = "invoice" | "escrow";

interface Props {
  cheq: Cheq;
}

// TODO: color coding should be part of design system
// Gray -> complete
// Purple -> pending
const STATUS_COLOR_MAP = {
  cashed: "gray.600",
  cashable: "green.900",
  voidable: "green.800",
  payable: "purple.900",
  paid: "gray.600",
  pending_escrow: "purple.900",
  pending_maturity: "purple.900",
  voided: "gray.600",
};

const TOOLTIP_MESSAGE_MAP = {
  cashed: "complete",
  cashable: "ready for payout",
  voidable: "payment in escrow",
  payable: "payment due",
  paid: "complete",
  pending_escrow: "awaiting payment",
  pending_maturity: "payment in escrow",
  voided: "cancelled",
};

function CheqCardV2({ cheq }: Props) {
  const { createdTransaction } = cheq;

  const createdLocaleDate = useMemo(() => {
    return createdTransaction.date.toLocaleDateString();
  }, [createdTransaction.date]);

  const status: CheqStatus | undefined = useMemo(() => {
    if (cheq.isPaid) {
      return "paid";
    }

    if (!cheq.isPaid && cheq.isPayer) {
      return "payable";
    }

    return "pending_escrow";
  }, [cheq.isPaid, cheq.isPayer]);

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
    <GridItem bg={STATUS_COLOR_MAP[status]} p={3} borderRadius={20}>
      <VStack
        alignItems="flex-start"
        justifyContent="space-between"
        h="100%"
        gap={2}
      >
        <HStack maxW="100%">
          <Box borderWidth="1px" borderRadius="full" boxShadow="md" p={2}>
            <Text fontSize="sm" textAlign="center">
              {TOOLTIP_MESSAGE_MAP[status]}
            </Text>
          </Box>
        </HStack>

        <Flex
          alignItems="flex-start"
          flexDirection="column"
          maxW="100%"
          gap={1}
        >
          <Text textOverflow="clip" noOfLines={1}>
            {createdLocaleDate}
          </Text>
          <HStack maxW="100%">
            <Text
              fontWeight={600}
              fontSize={"xl"}
              textOverflow="clip"
              noOfLines={1}
            >
              {cheq.formattedPayer}
            </Text>
            <ArrowForwardIcon mx={2} />
            <Text
              fontWeight={600}
              fontSize={"xl"}
              textOverflow="clip"
              noOfLines={1}
            >
              {cheq.formattedPayee}
            </Text>
          </HStack>

          <HStack>
            <Text fontWeight={400} fontSize={"xl"} my={0}>
              {cheq.amount} {cheq.token}
            </Text>

            <CurrencyIcon currency={cheq.token} />
          </HStack>
        </Flex>

        <VStack alignItems="flex-start" w="100%">
          <Center w="100%">
            <ButtonGroup>
              {status === "payable" ? (
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
                bg="brand.300"
                color="brand.200"
                w="min(40vw, 100px)"
                borderRadius={5}
                onClick={onOpenDetails}
              >
                Details
              </Button>
            </ButtonGroup>
          </Center>
        </VStack>
      </VStack>
      <DetailsModal
        isOpen={isDetailsOpen}
        onClose={onCloseDetails}
        cheq={cheq}
      />
      <ApproveAndPayModal isOpen={isPayOpen} onClose={onClosePay} cheq={cheq} />
    </GridItem>
  );
}

export default CheqCardV2;
