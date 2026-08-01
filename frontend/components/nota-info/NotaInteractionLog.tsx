import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Link,
  Spinner,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { BsPlugFill } from "react-icons/bs";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useEnsNames } from "../../hooks/useEnsNames";
import { NotaInteraction } from "../../utils/notaInteractions";
import AddressDisplay from "../designSystem/AddressDisplay";
import { notaInfoTheme as t } from "./notaInfoTheme";

interface Props {
  interactions: NotaInteraction[];
  interactionsLoading?: boolean;
  interactionsSource: "subgraph" | "none";
}

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AddressCell({
  address,
  shortenAddresses,
  ensNames,
}: {
  address: string | null;
  shortenAddresses: boolean;
  ensNames: Map<string, string | null>;
}) {
  if (!address || address === ethersZeroAddress()) {
    return (
      <Text color={t.muted2} fontSize="sm">
        —
      </Text>
    );
  }

  return (
    <AddressDisplay
      address={address}
      shorten={shortenAddresses}
      ensNames={ensNames}
      fontSize="sm"
      color={t.text}
    />
  );
}

const ethersZeroAddress = () => "0x0000000000000000000000000000000000000000";

function EmptyState({ message }: { message: string }) {
  return (
    <Box
      border="0.5px dashed"
      borderColor={t.line}
      borderRadius="14px"
      p="22px"
      textAlign="center"
      color={t.muted2}
      fontSize="13px"
      bg={t.cardBg}
    >
      <Box as="span" display="block" mb="6px">
        <BsPlugFill
          size={20}
          aria-hidden
          style={{ display: "inline-block" }}
        />
      </Box>
      {message}
    </Box>
  );
}

function NotaInteractionLog({
  interactions,
  interactionsLoading = false,
  interactionsSource,
}: Props) {
  const { blockchainState } = useBlockchainData();
  const explorer = blockchainState.explorer || "https://polygonscan.com/tx/";
  const shortenAddresses =
    useBreakpointValue({ base: true, md: false }) ?? false;
  const ensAddresses = useMemo(
    () => interactions.flatMap((interaction) => [interaction.from, interaction.to]),
    [interactions]
  );
  const ensNames = useEnsNames(ensAddresses);

  if (interactionsLoading) {
    return (
      <Stack align="center" py={6}>
        <Spinner size="md" color={t.primaryLight} />
      </Stack>
    );
  }

  if (interactions.length === 0) {
    return (
      <EmptyState
        message={
          interactionsSource === "none"
            ? "History unavailable while the subgraph is offline"
            : "No interactions indexed for this nota yet. The subgraph may still be syncing."
        }
      />
    );
  }

  return (
    <Box overflowX="auto" w="100%" py={1}>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th color={t.muted} borderColor={t.line}>Action</Th>
            <Th color={t.muted} borderColor={t.line}>From</Th>
            <Th color={t.muted} borderColor={t.line}>To</Th>
            <Th color={t.muted} borderColor={t.line}>Amount</Th>
            <Th color={t.muted} borderColor={t.line}>Date</Th>
            <Th borderColor={t.line} />
          </Tr>
        </Thead>
        <Tbody>
          {interactions.map((interaction) => (
            <Tr key={interaction.id}>
              <Td fontWeight="medium" color={t.textBright} borderColor={t.line}>
                {interaction.action}
              </Td>
              <Td borderColor={t.line}>
                <AddressCell
                  address={interaction.from}
                  shortenAddresses={shortenAddresses}
                  ensNames={ensNames}
                />
              </Td>
              <Td borderColor={t.line}>
                <AddressCell
                  address={interaction.to}
                  shortenAddresses={shortenAddresses}
                  ensNames={ensNames}
                />
              </Td>
              <Td fontSize="sm" color={t.text} borderColor={t.line}>
                {interaction.amount ?? (
                  <Text as="span" color={t.muted2}>
                    —
                  </Text>
                )}
              </Td>
              <Td fontSize="sm" whiteSpace="nowrap" color={t.muted} borderColor={t.line}>
                {formatDate(interaction.timestamp)}
              </Td>
              <Td borderColor={t.line}>
                <Link
                  href={`${explorer}${interaction.txHash}`}
                  isExternal
                  aria-label="View transaction"
                  color={t.muted}
                  _hover={{ color: t.primaryLight }}
                >
                  <ExternalLinkIcon />
                </Link>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default NotaInteractionLog;
