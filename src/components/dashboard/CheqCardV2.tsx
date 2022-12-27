import { ArrowForwardIcon } from "@chakra-ui/icons";
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
  Box,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { Cheq } from "../../hooks/useCheqs";
import CurrencyIcon, { CheqCurrency } from "../designSystem/CurrencyIcon";
import DetailsModal from "./details/DetailsModal";
import ApproveAndPayModal from "./pay/ApproveAndPayModal";
import { Spinner } from "@chakra-ui/react";

export type CheqStatus =
  | "pending"
  | "cashed"
  | "voidable"
  | "payable"
  | "cashable"
  | "paid";

export type CheqType = "invoice" | "escrow";

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
  const {
    sender,
    amount,
    token,
    recipient,
    formattedSender,
    formattedRecipient,
  } = cheq;
  const { blockchainState } = useBlockchainData();

  const [isCashable, setIsCashable] = useState<boolean | undefined>(undefined);

  const [isEarlyReleased, setIsEarlyReleased] = useState<boolean | undefined>(
    undefined
  );

  const [cashingInProgress, setCashingInProgress] = useState(false);

  const [releaseInProgress, setReleaseInProgress] = useState(false);

  const [maturityDate, setMaturityDate] = useState("");

  const createdLocaleDate = useMemo(() => {
    return cheq.createdDate.toLocaleDateString();
  }, [cheq.createdDate]);

  const {
    status,
    type,
  }: { status: CheqStatus | undefined; type: CheqType | undefined } =
    useMemo(() => {
      if (isCashable === undefined || isEarlyReleased === undefined) {
        return { status: undefined, type: undefined };
      }

      // TODO: use another method for determining invoice vs cheq
      if (cheq.owner === cheq.sender) {
        // Invoice
        if (
          blockchainState.account.toLowerCase() === cheq.recipient.toLowerCase()
        ) {
          // BUG: will appear as payable after it's been cashed
          if (isCashable) {
            return { status: "voidable", type: "invoice" };
          } else if (cheq.escrowed === 0) {
            return { status: "payable", type: "invoice" };
          } else {
            return { status: "paid", type: "invoice" };
          }
        } else {
          if (isCashable) {
            return { status: "cashable", type: "invoice" };
          } else {
            return { status: "pending", type: "invoice" };
          }
        }
      } else {
        // Cheq
        if (
          blockchainState.account.toLowerCase() === cheq.sender.toLowerCase()
        ) {
          // BUG: will appear as payable after it's been cashed
          if (isCashable) {
            return { status: "voidable", type: "escrow" };
          } else {
            return { status: "paid", type: "escrow" };
          }
        } else {
          if (isCashable) {
            return { status: "cashable", type: "escrow" };
          } else {
            return { status: "pending", type: "escrow" };
          }
        }
      }
    }, [
      blockchainState.account,
      cheq.escrowed,
      cheq.owner,
      cheq.recipient,
      cheq.sender,
      isCashable,
      isEarlyReleased,
    ]);

  useEffect(() => {
    async function fetchData() {
      try {
        const cheqId = Number(cheq.id);
        const caller = blockchainState.account;
        const cashableAmount: number =
          await blockchainState.selfSignBroker?.cashable(cheqId, caller, 0);
        setIsCashable(cashableAmount > 0);

        const maturity: BigNumber =
          await blockchainState.selfSignBroker?.cheqInspectionPeriod(cheqId);
        const date = new Date(cheq.createdDate);
        date.setDate(date.getDate() + maturity.toNumber() / 86400);
        setMaturityDate(date.toDateString());

        const isEarlyReleased =
          await blockchainState.selfSignBroker?.isEarlyReleased(cheqId);
        setIsEarlyReleased(isEarlyReleased);
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, [
    blockchainState.account,
    blockchainState.selfSignBroker,
    cheq.createdDate,
    cheq.id,
  ]);

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

  const earlyRelease = useCallback(async () => {
    setReleaseInProgress(true);

    try {
      const cheqId = BigNumber.from(cheq.id);

      const tx = await blockchainState.selfSignBroker?.earlyRelease(
        cheqId,
        true
      );
      await tx.wait();
      setIsEarlyReleased(true);
    } catch (error) {
      console.log(error);
    } finally {
      setReleaseInProgress(false);
    }
  }, [blockchainState.selfSignBroker, cheq.id]);

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
    return <Skeleton h="200px" borderRadius={"10px"} />;
  }

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
              {type}
            </Text>
          </Box>
          <Box borderWidth="1px" borderRadius="full" boxShadow="md" p={2}>
            <Tooltip
              label={TOOLTIP_MESSAGE_MAP[status]}
              aria-label="status tooltip"
              placement="right"
            >
              <Text fontSize="sm" textAlign="center">
                {status}
              </Text>
            </Tooltip>
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
              {formattedSender}
            </Text>
            <ArrowForwardIcon mx={2} />
            <Text
              fontWeight={600}
              fontSize={"xl"}
              textOverflow="clip"
              noOfLines={1}
            >
              {formattedRecipient}
            </Text>
          </HStack>

          <HStack>
            <Text fontWeight={400} fontSize={"xl"} my={0}>
              {amount} {token}
            </Text>

            <CurrencyIcon currency={token} />
          </HStack>
        </Flex>

        <VStack alignItems="flex-start" w="100%">
          <Center w="100%">
            <ButtonGroup colorScheme="teal">
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

              {status === "voidable" && !isEarlyReleased ? (
                <Menu>
                  <MenuButton
                    disabled={releaseInProgress || cashingInProgress}
                    as={Button}
                    minW={0}
                  >
                    Options{" "}
                    {releaseInProgress || cashingInProgress ? (
                      <Spinner size="xs" />
                    ) : null}
                  </MenuButton>
                  <MenuList alignItems={"center"}>
                    <MenuItem onClick={earlyRelease}>Release</MenuItem>
                    <MenuItem onClick={cashCheq}>Void</MenuItem>
                  </MenuList>
                </Menu>
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
      <DetailsModal
        isOpen={isDetailsOpen}
        onClose={onCloseDetails}
        cheq={cheq}
        maturityDate={maturityDate}
      />
      <ApproveAndPayModal isOpen={isPayOpen} onClose={onClosePay} cheq={cheq} />
    </GridItem>
  );
}

export default CheqCardV2;
