import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Button,
  ButtonGroup,
  Center,
  Flex,
  GridItem,
  HStack,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useMemo } from "react";
import {
  MdOutlineAttachMoney,
  MdOutlineDoneAll,
  MdOutlineHourglassEmpty,
} from "react-icons/md";
import { Cheq } from "../../hooks/useCheqs";
import CurrencyIcon from "../designSystem/CurrencyIcon";
import DetailsModal from "./details/DetailsModal";
import ApproveAndPayModal from "./pay/ApproveAndPayModal";

// Add more state when the escrow module is ready
export type CheqStatus = "pending_payment" | "payable" | "paid";

export type CheqType = "invoice" | "escrow";

interface Props {
  cheq: Cheq;
}

// TODO: color coding should be part of design system
// Gray -> complete
// Purple -> pending
const STATUS_COLOR_MAP = {
  payable: "purple.900",
  paid: "gray.600",
  pending_payment: "purple.900",
};

const TOOLTIP_MESSAGE_MAP = {
  payable: "payment due",
  paid: "paid",
  pending_payment: "awaiting payment",
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

    return "pending_payment";
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

  const icon = useMemo(() => {
    switch (status) {
      case "paid":
        return <MdOutlineDoneAll color="white" size={20} />;
      case "payable":
        return <MdOutlineAttachMoney color="white" size={20} />;
      case "pending_payment":
        return <MdOutlineHourglassEmpty color="white" size={20} />;
    }
  }, [status]);

  const iconColor = useMemo(() => {
    switch (status) {
      case "paid":
        return "#00C28E";
      case "payable":
        return "#4A67ED";
      case "pending_payment":
        return "#C5CCD8";
    }
  }, [status]);

  return (
    <GridItem
      bg={STATUS_COLOR_MAP[status]}
      px={6}
      pt={4}
      pb={3}
      borderRadius={20}
    >
      <VStack
        alignItems="flex-start"
        justifyContent="space-between"
        h="100%"
        gap={2.5}
      >
        <Flex
          alignItems="flex-start"
          flexDirection="column"
          maxW="100%"
          w="100%"
          gap={2.5}
        >
          <HStack justifyContent={"space-between"} w="100%">
            <Text textOverflow="clip" noOfLines={1} fontSize="lg">
              {createdLocaleDate}
            </Text>
            <Tooltip
              label={TOOLTIP_MESSAGE_MAP[status]}
              aria-label="status tooltip"
              placement="bottom"
              bg="brand.100"
              textColor="white"
            >
              <Center
                bgColor={iconColor}
                aria-label="status"
                borderRadius={"full"}
                w={"30px"}
                h={"30px"}
              >
                {icon}
              </Center>
            </Tooltip>
          </HStack>
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
                  variant="outline"
                  w="min(40vw, 100px)"
                  borderRadius={5}
                  colorScheme="teal"
                  onClick={onOpenPay}
                >
                  Pay
                </Button>
              ) : null}
              <Button
                variant="outline"
                borderColor="brand.200"
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
