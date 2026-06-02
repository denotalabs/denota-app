import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Heading,
  Link,
  Spinner,
  Stack,
  Table,
  useBreakpointValue,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { useMemo } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useEnsNames } from "../../hooks/useEnsNames";
import { NotaInteraction } from "../../utils/notaInteractions";
import AddressDisplay from "../designSystem/AddressDisplay";

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
      <Text color="gray.400" fontSize="sm">
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
    />
  );
}

const ethersZeroAddress = () => "0x0000000000000000000000000000000000000000";

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

  return (
    <Box w="100%">
      <Heading size="sm" mb={3}>
        Interaction history
      </Heading>
      {interactionsLoading ? (
        <Stack align="center" py={4}>
          <Spinner size="md" />
        </Stack>
      ) : interactions.length === 0 ? (
        <Text fontSize="sm" color="gray.500">
          {interactionsSource === "none"
            ? "The subgraph is unavailable, so interaction history cannot be shown."
            : "No interactions indexed for this nota yet. The subgraph may still be syncing."}
        </Text>
      ) : (
        <Box overflowX="auto" w="100%">
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Action</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Amount</Th>
                <Th>Date</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {interactions.map((interaction) => (
                <Tr key={interaction.id}>
                  <Td fontWeight="medium">{interaction.action}</Td>
                  <Td>
                    <AddressCell
                      address={interaction.from}
                      shortenAddresses={shortenAddresses}
                      ensNames={ensNames}
                    />
                  </Td>
                  <Td>
                    <AddressCell
                      address={interaction.to}
                      shortenAddresses={shortenAddresses}
                      ensNames={ensNames}
                    />
                  </Td>
                  <Td fontSize="sm">
                    {interaction.amount ?? (
                      <Text as="span" color="gray.400">
                        —
                      </Text>
                    )}
                  </Td>
                  <Td fontSize="sm" whiteSpace="nowrap">
                    {formatDate(interaction.timestamp)}
                  </Td>
                  <Td>
                    <Link
                      href={`${explorer}${interaction.txHash}`}
                      isExternal
                      aria-label="View transaction"
                    >
                      <ExternalLinkIcon />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}

export default NotaInteractionLog;
