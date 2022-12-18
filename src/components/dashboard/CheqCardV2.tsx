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
  Tooltip,
  Skeleton,
} from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { Cheq } from "../../hooks/useCheqs";
import CurrencyIcon, { CheqCurrency } from "../designSystem/CurrencyIcon";
import DetailsModal from "./details/DetailsModal";
import ApproveAndPayModal from "./pay/ApproveAndPayModal";

export type CheqStatus =
  | "cashed"
  | "voidable"
  | "payable"
  | "cashable"
  | "paid";

interface Props {
  cheq: Cheq;
}

const STATUS_COLOR_MAP = {
  cashed: "blue.900",
  cashable: "green.900",
  voidable: "gray.600",
  payable: "blue.900",
  paid: "green.900",
  pending: "purple.900",
};

const TOOLTIP_MESSAGE_MAP = {
  cashed: "Payment has been cashed",
  cashable: "Payment can be cashed",
  voidable: "Payment has been made but can be cancelled",
  payable: "Payment is pending",
  paid: "Payment has been made",
  pending: "Payment is pending",
};

function CheqCardV2({ cheq }: Props) {
  const { sender, amount, token } = cheq;
  const { blockchainState } = useBlockchainData();

  const [isCashable, setIsCashable] = useState<boolean | undefined>(undefined);

  const [cashingInProgress, setCashingInProgress] = useState(false);

  const status = useMemo(() => {
    if (isCashable === undefined) {
      return undefined;
    }

    if (cheq.owner === cheq.sender) {
      // Invoice
      if (
        blockchainState.account.toLowerCase() === cheq.recipient.toLowerCase()
      ) {
        // BUG: will appear as payable after it's been cashed
        if (cheq.escrowed === 0) {
          return "payable";
        } else if (isCashable) {
          return "voidable";
        } else {
          return "paid";
        }
      } else {
        if (isCashable) {
          return "cashable";
        } else {
          return "pending";
        }
      }
    } else {
      // Cheq
      if (blockchainState.account.toLowerCase() === cheq.sender.toLowerCase()) {
        // BUG: will appear as payable after it's been cashed
        if (isCashable) {
          return "voidable";
        } else {
          return "paid";
        }
      } else {
        if (isCashable) {
          return "cashable";
        } else {
          return "pending";
        }
      }
    }
  }, [blockchainState.account, cheq, isCashable]);

  useEffect(() => {
    async function fetchData() {
      const cheqId = Number(cheq.id);
      const caller = blockchainState.account;
      const cashableAmount: number =
        await blockchainState.selfSignBroker?.cashable(cheqId, caller, 0);
      setIsCashable(cashableAmount > 0);
    }
    fetchData();
  }, [blockchainState.account, blockchainState.selfSignBroker, cheq.id]);

  const cashCheq = useCallback(async () => {
    setCashingInProgress(true);

    try {
      const cheqId = BigNumber.from(cheq.id);
      const caller = blockchainState.account;
      const cashableAmount: number =
        await blockchainState.selfSignBroker?.cashable(cheqId, caller, 0);

      const tx = await blockchainState.selfSignBroker?.cashCheq(
        cheqId,
        cashableAmount
      );
      await tx.wait();
    } catch (error) {
      console.log(error);
    } finally {
      setCashingInProgress(false);
    }
  }, [blockchainState.account, blockchainState.selfSignBroker, cheq.id]);

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

  if (status === undefined) {
    return <Skeleton w="100%" maxW={"400px"} h="180" borderRadius={"10px"} />;
  }

  return (
    <GridItem
      w="100%"
      maxW={"400px"}
      h="180"
      bg={STATUS_COLOR_MAP[status]}
      p={3}
      borderRadius={20}
    >
      <VStack alignItems="flex-start" justifyContent="space-between" h="100%">
        <Flex alignItems="flex-start" flexDirection="column" maxW="100%">
          <Text
            fontWeight={600}
            fontSize={"xl"}
            textOverflow="clip"
            maxW="50%"
            noOfLines={1}
          >
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
          <Tooltip
            label={TOOLTIP_MESSAGE_MAP[status]}
            aria-label="status tooltip"
            placement="right"
          >
            <Text fontWeight={600} fontSize={"xl"}>
              {status}
            </Text>
          </Tooltip>
          <Center w="100%">
            <ButtonGroup gap="4">
              {status === "cashable" ? (
                <Button
                  w="min(40vw, 100px)"
                  borderRadius={5}
                  colorScheme="teal"
                  onClick={cashCheq}
                  isLoading={cashingInProgress}
                >
                  Cash
                </Button>
              ) : null}
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
      <ApproveAndPayModal isOpen={isPayOpen} onClose={onClosePay} cheq={cheq} />
    </GridItem>
  );
}

export default CheqCardV2;
