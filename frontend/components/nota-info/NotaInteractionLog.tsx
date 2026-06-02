import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Heading,
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
} from "@chakra-ui/react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useFormatAddress } from "../../hooks/useFormatAddress";
import { NotaInteraction } from "../../utils/notaInteractions";

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

function AddressCell({ address }: { address: string | null }) {
  const { formatAddress } = useFormatAddress();

  if (!address || address === ethersZeroAddress()) {
    return (
      <Text color="gray.400" fontSize="sm">
        —
      </Text>
    );
  }

  return (
    <Text fontSize="sm" title={address}>
      {formatAddress(address)}
    </Text>
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
                    <AddressCell address={interaction.from} />
                  </Td>
                  <Td>
                    <AddressCell address={interaction.to} />
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
