import { ArrowForwardIcon } from "@chakra-ui/icons";
import {
  Button,
  ButtonGroup,
  Center,
  Flex,
  GridItem,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { Nota } from "@denota-labs/denota-sdk";
import { useCallback, useMemo, useState } from "react";
import {
  MdCancel,
  MdDoneAll,
  MdHelpOutline,
  MdHourglassDisabled,
  MdHourglassTop,
  MdLock,
  MdLockPerson,
  MdMonetizationOn,
  MdSwapHorizontalCircle
} from "react-icons/md";
import { useCashNota } from "../../hooks/useCashNota";
import { useEnsNames } from "../../hooks/useEnsNames";
import { useTokens } from "../../hooks/useTokens";
import AddressDisplay from "../designSystem/AddressDisplay";
import CurrencyIcon from "../designSystem/CurrencyIcon";
import DetailsModal from "./details/DetailsModal";
// import ApproveAndPayModal from "./pay/ApproveAndPayModal";

interface Props {
  nota: Nota;
}
const TOOLTIP_MESSAGE_MAP = {
  paid: "paid",
  claimable: "payment can be claimed",
  awaiting_claim: "waiting for funds to be claimed",
  awaiting_release: "waiting for funds to be released",
  releasable: "payment can be released or voided",
  released: "released by inspector",
  claimed: "claimed by owner",
  expired: "past expiration date",
  returnable: "funds can be returned",
  returned: "returned by inspector",
  locked: "payment is currently locked",
  "?": "unknown status"
};

function NotaCard({ nota }: Props) {
  const hashCode = (s: string) =>
    s.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
  const GRADIENT_COLORS = [
    ["#F4F4F5", "#E4E4E7"],
    ["#FAFAFA", "#D4D4D8"],
    ["#F5F5F5", "#E4E4E7"],
    ["#F4F4F5", "#D1D5DB"],
    ["#FAFAFA", "#E5E7EB"],
    ["#F3F4F6", "#D4D4D8"],
    ["#FAFAFA", "#E4E4E7"],
    ["#F4F4F5", "#C4C4C4"],
  ];

  const generateNotaGradient = (nota: Nota): string => {
    const { id, totalAmountSent, sender, receiver } = nota;
    const hash = hashCode(`${id}${totalAmountSent}${sender}${receiver}`);
    const colorIndex = Math.abs(hash) % GRADIENT_COLORS.length;
    const [startColor, endColor] = GRADIENT_COLORS[colorIndex];
    return `linear-gradient(180deg, ${startColor}, ${endColor})`;
  };

  const { token, createdAt } = nota;

  const createdLocaleDate = useMemo(() => {
    return createdAt.toLocaleDateString();
  }, [createdAt]);
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

  const ensNames = useEnsNames([nota.sender, nota.receiver]);

  const icon = useMemo(() => {
    switch (nota.moduleData.status) {
      case "paid":
        return <MdDoneAll color="white" size={20} />;
      case "claimable":
        return <MdMonetizationOn color="white" size={20} />;
      case "awaiting_claim":
        return <MdHourglassTop color="white" size={20} />;
      case "awaiting_release":
        return <MdLockPerson color="white" size={20} />;
      case "releasable":
        return <MdSwapHorizontalCircle color="white" size={20} />;
      case "released":
        return <MdDoneAll color="white" size={20} />; // MdTrendingUp
      case "claimed":
        return <MdDoneAll color="white" size={20} />;
      case "expired":
        return <MdHourglassDisabled color="white" size={20} />;
      case "returnable":
        return <MdSwapHorizontalCircle color="white" size={20} />;
      case "returned":
        return <MdCancel color="white" size={20} />;
      case "locked":
        return <MdLock color="white" size={20} />;
      default:
        return <MdHelpOutline color="white" size={20} />;
    }
  }, [nota.moduleData.status]);

  const iconColor = useMemo(() => {
    // Green = good, yellow = action needed, red = bad, gray = waiting
    switch (nota.moduleData.status) {
      case "paid":
        return "#00C28E"; // green
      case "claimable":
        return "#FFD700"; // yellow
      case "awaiting_release":
        return "#C5CCD8"; // gray
      case "awaiting_claim":
        return "#C5CCD8"; // gray
      case "releasable":
        return "#FFD700"; // yellow
      case "returnable":
        return "#FFD700"; // yellow
      case "released":
        return "#00C28E"; // green
      case "claimed":
        return "#00C28E"; // green
      case "expired":
        return "#E53E3E"; // red
      case "returned":
        return "#E53E3E"; // red
      case "locked":
        return "#C5CCD8"; // gray
      default:
        return "#242526"; // black
    }
  }, [nota.moduleData.status]);
  const gradient = generateNotaGradient(nota);

  const { weiAddressToDisplay, currencyForTokenId } = useTokens();

  const [cashingInProgress, setCashingInProgress] = useState(false);

  const { releaseNota, reverseNota } = useCashNota();

  const handleRelease = useCallback(async () => {
    setCashingInProgress(true);
    await releaseNota({
      nota,
    });
    setCashingInProgress(false);
  }, [nota, releaseNota]);

  const handleVoid = useCallback(async () => {
    setCashingInProgress(true);
    await reverseNota({
      nota,
    });
    setCashingInProgress(false);
  }, [nota, reverseNota]);

  return (
    <GridItem
      bg={gradient}
      px={6}
      pt={4}
      pb={3}
      borderRadius={20}
      border="1px solid"
      borderColor="gray.200"
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
              label={TOOLTIP_MESSAGE_MAP[nota.moduleData.status]}
              aria-label="status tooltip"
              placement="bottom"
              bg="gray.900"
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
            <AddressDisplay
              address={nota.sender}
              ensNames={ensNames}
              fontWeight={600}
              fontSize="xl"
              textOverflow="clip"
              noOfLines={1}
            />
            <ArrowForwardIcon mx={2} />
            <AddressDisplay
              address={nota.receiver}
              ensNames={ensNames}
              fontWeight={600}
              fontSize="xl"
              textOverflow="clip"
              noOfLines={1}
            />
          </HStack>

          <HStack>
            <Text fontWeight={400} fontSize={"xl"} my={0}>
              {weiAddressToDisplay(nota.totalAmountSent, token)} {currencyForTokenId(token)}
            </Text>

            <CurrencyIcon currency={currencyForTokenId(token)} />
          </HStack>
        </Flex>

        <VStack alignItems="flex-start" w="100%">
          <Center w="100%">
            <ButtonGroup>
              {(nota.moduleData.status === "returnable" || nota.moduleData.status === "releasable") ? (
                <Menu>
                  <MenuButton disabled={cashingInProgress} as={Button} minW={0}>
                    Options {cashingInProgress ? <Spinner size="xs" /> : null}
                  </MenuButton>
                  <MenuList alignItems={"center"}>
                    <MenuItem onClick={handleVoid}>Return</MenuItem>
                    <MenuItem onClick={handleRelease}>Release</MenuItem>
                  </MenuList>
                </Menu>
              ) : nota.moduleData.status === "claimable" ? (
                <Menu>
                  <MenuButton disabled={cashingInProgress} as={Button} minW={0}>
                    Options {cashingInProgress ? <Spinner size="xs" /> : null}
                  </MenuButton>
                  <MenuList alignItems={"center"}>
                    <MenuItem onClick={handleRelease}>Claim</MenuItem>
                  </MenuList>
                </Menu>
              ) : null}
              <Button
                variant="outline"
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
        nota={nota}
      />
      {/* <ApproveAndPayModal isOpen={isPayOpen} onClose={onClosePay} nota={nota} /> */}
    </GridItem>
  );
}

export default NotaCard;
