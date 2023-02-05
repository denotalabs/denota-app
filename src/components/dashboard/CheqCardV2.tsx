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
  useDisclosure,
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
import CurrencyIcon from "../designSystem/CurrencyIcon";
import DetailsModal from "./details/DetailsModal";
import ApproveAndPayModal from "./pay/ApproveAndPayModal";
import { Spinner } from "@chakra-ui/react";

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
  cashable: "purple.900",
  voidable: "purple.900",
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
  const { blockchainState } = useBlockchainData();

  const [isCashable, setIsCashable] = useState<boolean | undefined>(undefined);

  const [isEarlyReleased, setIsEarlyReleased] = useState<boolean | undefined>(
    undefined
  );

  const [isFunder, setIsFunder] = useState<boolean | undefined>(undefined);

  const [isInvoice, setIsInvoice] = useState<boolean | undefined>(undefined);

  const [isVoided, setIsVoided] = useState<boolean | undefined>(undefined);

  const [cashingInProgress, setCashingInProgress] = useState(false);

  const [cashingComplete, setCashingComplete] = useState<boolean>(false);

  const [releaseInProgress, setReleaseInProgress] = useState(false);

  const [maturityDate, setMaturityDate] = useState<Date | undefined>(undefined);

  const createdLocaleDate = useMemo(() => {
    return cheq.createdDate.toLocaleDateString();
  }, [cheq.createdDate]);

  const status: CheqStatus | undefined = useMemo(() => {
    if (
      isCashable === undefined ||
      isEarlyReleased === undefined ||
      isFunder === undefined
    ) {
      return undefined;
    }

    if (cheq.isCashed || cashingComplete) {
      if (isVoided) {
        return "voided";
      }
      if (isFunder) {
        return "paid";
      } else {
        return "cashed";
      }
    }

    if (isEarlyReleased && isFunder) {
      return "paid";
    }

    if (isCashable) {
      if (isFunder) {
        return "voidable";
      } else {
        return "cashable";
      }
    }

    if (!cheq.hasEscrow) {
      if (isFunder) {
        return "payable";
      } else {
        return "pending_escrow";
      }
    }

    if (isFunder) {
      return "paid";
    }

    return "pending_maturity";
  }, [
    cashingComplete,
    cheq.hasEscrow,
    cheq.isCashed,
    isCashable,
    isEarlyReleased,
    isFunder,
    isVoided,
  ]);

  const payer = useMemo(() => {
    if (isInvoice === undefined) {
      return undefined;
    }
    if (isInvoice) {
      return cheq.formattedRecipient;
    }
    return cheq.formattedSender;
  }, [cheq.formattedRecipient, cheq.formattedSender, isInvoice]);

  const payee = useMemo(() => {
    if (isInvoice === undefined) {
      return undefined;
    }
    if (isInvoice) {
      return cheq.formattedSender;
    }
    return cheq.formattedRecipient;
  }, [cheq.formattedRecipient, cheq.formattedSender, isInvoice]);

  useEffect(() => {
    async function fetchData() {
      setIsCashable(undefined);
      try {
        const cheqId = Number(cheq.id);
        const caller = blockchainState.account;
        const cashableAmount: number =
          await blockchainState.selfSignBroker?.cashable(cheqId, caller, 0);
        setIsCashable(cashableAmount > 0);

        const maturity: BigNumber =
          await blockchainState.selfSignBroker?.cheqInspectionPeriod(cheqId);

        if (cheq.fundedDate) {
          const maturityTime = cheq.fundedTimestamp + maturity.toNumber();
          setMaturityDate(new Date(maturityTime * 1000));
        }

        const isEarlyReleased =
          await blockchainState.selfSignBroker?.isEarlyReleased(cheqId);
        setIsEarlyReleased(isEarlyReleased);

        const funder = await blockchainState.selfSignBroker?.cheqFunder(cheqId);
        setIsFunder(
          blockchainState.account.toLowerCase() === funder.toLowerCase()
        );
        setIsInvoice(cheq.recipient.toLowerCase() === funder.toLowerCase());
        setIsVoided(cheq.casher?.toLowerCase() === funder.toLowerCase());
      } catch (error) {
        console.log(error);
      }
    }
    fetchData();
  }, [
    blockchainState.account,
    blockchainState.selfSignBroker,
    cheq.casher,
    cheq.createdDate,
    cheq.fundedDate,
    cheq.fundedTimestamp,
    cheq.id,
    cheq.recipient,
  ]);

  const cashCheq = useCallback(
    async (isVoid = false) => {
      setCashingInProgress(true);

      try {
        if (blockchainState.selfSignBroker) {
          const cheqId = BigNumber.from(cheq.id);
          const tx = await blockchainState.selfSignBroker["cashCheq(uint256)"](
            cheqId
          );
          await tx.wait();
          setCashingComplete(true);
          setIsVoided(isVoid);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setCashingInProgress(false);
      }
    },
    [blockchainState.selfSignBroker, cheq.id]
  );

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

  if (status === undefined || payer === undefined || payee === undefined) {
    return <Skeleton h="225px" borderRadius={"10px"} />;
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
              {payer}
            </Text>
            <ArrowForwardIcon mx={2} />
            <Text
              fontWeight={600}
              fontSize={"xl"}
              textOverflow="clip"
              noOfLines={1}
            >
              {payee}
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
              {status === "cashable" ? (
                <Button
                  w="min(40vw, 100px)"
                  borderRadius={5}
                  colorScheme="teal"
                  onClick={() => {
                    cashCheq();
                  }}
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
                    <MenuItem
                      onClick={() => {
                        cashCheq(true);
                      }}
                    >
                      Void
                    </MenuItem>
                  </MenuList>
                </Menu>
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
        maturityDate={maturityDate}
        isVoided={isVoided}
        payee={payee}
        payer={payer}
      />
      <ApproveAndPayModal isOpen={isPayOpen} onClose={onClosePay} cheq={cheq} />
    </GridItem>
  );
}

export default CheqCardV2;
