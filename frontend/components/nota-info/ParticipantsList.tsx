import { CopyIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import {
  Box,
  Center,
  Flex,
  HStack,
  Link,
  Text,
  Tooltip,
  useClipboard,
  useToast,
} from "@chakra-ui/react";
import { blockExplorerAddressUrl } from "../../context/config/chains";
import AddressDisplay from "../designSystem/AddressDisplay";
import { notaInfoTheme as t } from "../designSystem/notaInfoTheme";

export interface Participant {
  name: string;
  description: string;
  address: string | null;
}

interface Props {
  participants: Participant[];
  ensNames: Map<string, string | null>;
  shortenAddresses: boolean;
  explorerTxBase: string;
}

function ParticipantRow({
  participant,
  isLast,
  ensNames,
  shortenAddresses,
  explorerTxBase,
}: {
  participant: Participant;
  isLast: boolean;
  ensNames: Map<string, string | null>;
  shortenAddresses: boolean;
  explorerTxBase: string;
}) {
  const { onCopy } = useClipboard(participant.address ?? "");
  const toast = useToast();

  return (
    <Flex
      align="center"
      gap={3}
      py={3}
      borderBottom={isLast ? "none" : "0.5px solid"}
      borderColor={t.line}
    >
      <Center
        w="34px"
        h="34px"
        borderRadius="full"
        bg={t.primaryDim}
        color={t.primaryLight}
        border="0.5px solid"
        borderColor={t.line}
        fontSize="xs"
        fontWeight={500}
        flexShrink={0}
      >
        {participant.name.slice(0, 2).toUpperCase()}
      </Center>
      <Box flex={1} minW={0}>
        <Text fontSize="13.5px" fontWeight={500} color={t.textBright}>
          {participant.name}
        </Text>
        <Text fontSize="xs" color={t.muted}>
          {participant.description}
        </Text>
      </Box>
      <HStack spacing={2}>
        {participant.address ? (
          <>
            <AddressDisplay
              address={participant.address}
              shorten={shortenAddresses}
              ensNames={ensNames}
              fontFamily="mono"
              fontSize="12.5px"
              color={t.text}
            />
            <Tooltip label="Copy address" placement="top" shouldWrapChildren>
              <CopyIcon
                boxSize={3.5}
                cursor="pointer"
                color={t.muted}
                _hover={{ color: t.primaryLight }}
                onClick={() => {
                  onCopy();
                  toast({
                    title: "Address copied",
                    status: "success",
                    duration: 1000,
                    isClosable: true,
                  });
                }}
              />
            </Tooltip>
            <Tooltip
              label="View on block explorer"
              placement="top"
              shouldWrapChildren
            >
              <Link
                href={blockExplorerAddressUrl(
                  explorerTxBase,
                  participant.address
                )}
                isExternal
                aria-label="View on block explorer"
                display="inline-flex"
                color={t.muted}
                _hover={{ color: t.primaryLight }}
                lineHeight={0}
              >
                <ExternalLinkIcon boxSize={3.5} />
              </Link>
            </Tooltip>
          </>
        ) : (
          <Text fontSize="13px" color={t.muted2}>
            None
          </Text>
        )}
      </HStack>
    </Flex>
  );
}

function ParticipantsList({
  participants,
  ensNames,
  shortenAddresses,
  explorerTxBase,
}: Props) {
  return (
    <Box>
      {participants.map((participant, index) => (
        <ParticipantRow
          key={participant.name}
          participant={participant}
          isLast={index === participants.length - 1}
          ensNames={ensNames}
          shortenAddresses={shortenAddresses}
          explorerTxBase={explorerTxBase}
        />
      ))}
    </Box>
  );
}

export default ParticipantsList;
