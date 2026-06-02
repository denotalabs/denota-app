import {
  ArrowBackIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Heading,
  Image,
  Link,
  Stack,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useFormatAddress } from "../../hooks/useFormatAddress";
import { NotaInfoData } from "../../hooks/useNotaInfo";
import { POLYGON_REGISTRAR_ADDRESS } from "../../hooks/usePublicNotas";
import {
  formatMetadataAttributeValue,
  truncateAddress,
} from "../../utils/notaTokenUri";
import DetailsRow from "../designSystem/DetailsRow";
import RoundedBox from "../designSystem/RoundedBox";
import NotaInteractionLog from "./NotaInteractionLog";

interface Props {
  notaId: string;
  data: NotaInfoData;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function loadingOrValue(loading: boolean, value: string | null | undefined): string {
  if (loading) {
    return "…";
  }
  return value ?? "—";
}

function NotaInfoScreen({ notaId, data }: Props) {
  const { formatAddress } = useFormatAddress();
  const {
    owner,
    ownerLoading,
    approved,
    approvedLoading,
    onChainState,
    onChainStateLoading,
    metadata,
    metadataLoading,
    sender,
    receiver,
    interactions,
    interactionsLoading,
    interactionsSource,
  } = data;

  if (data.notFound && !ownerLoading) {
    return (
      <VStack spacing={4} py={10}>
        <Text>{data.error ?? "Nota not found"}</Text>
        <Button as={NextLink} href="/" leftIcon={<ArrowBackIcon />}>
          Back to dashboard
        </Button>
      </VStack>
    );
  }

  const displayAttributes = metadata?.attributes ?? [];

  const openSeaUrl = `https://opensea.io/assets/matic/${POLYGON_REGISTRAR_ADDRESS}/${notaId}`;

  const approvedDisplay =
    approved && approved !== ZERO_ADDRESS ? formatAddress(approved) : "None";
  const approvedCopy =
    approved && approved !== ZERO_ADDRESS ? approved : "";

  return (
    <VStack
      width="95%"
      maxW="56rem"
      mt={{ base: 6, lg: 10 }}
      mb={10}
      p={{ base: 4, md: 6 }}
      borderRadius="30px"
      gap={6}
      align="stretch"
      bg="brand.100"
    >
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "center" }}
        spacing={3}
      >
        <Box>
          <Button
            as={NextLink}
            href="/"
            variant="ghost"
            size="sm"
            leftIcon={<ArrowBackIcon />}
            mb={2}
            px={0}
          >
            Dashboard
          </Button>
          <Heading size="lg">Nota #{notaId}</Heading>
        </Box>
        <Button
          as="a"
          href={openSeaUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          alignSelf={{ base: "flex-start", md: "center" }}
        >
          View on OpenSea
        </Button>
      </Stack>

      <RoundedBox px={6} py={2}>
        <Heading size="sm" pt={3} pb={1}>
          Current state
        </Heading>
        <VStack gap={0} align="stretch">
          <DetailsRow
            title="Owner"
            value={
              owner && !ownerLoading
                ? formatAddress(owner)
                : loadingOrValue(ownerLoading, null)
            }
            copyValue={owner && !ownerLoading ? owner : ""}
          />
          <DetailsRow
            title="Approved"
            value={
              approvedLoading
                ? "…"
                : approvedDisplay
            }
            copyValue={approvedCopy}
          />
          <DetailsRow
            title="Escrow"
            value={
              onChainState && !onChainStateLoading
                ? `${onChainState.escrow} ${onChainState.currencySymbol}`
                : loadingOrValue(onChainStateLoading, null)
            }
          />
          <DetailsRow
            title="Currency"
            value={
              onChainState && !onChainStateLoading
                ? onChainState.currency
                : loadingOrValue(onChainStateLoading, null)
            }
            copyValue={
              onChainState && !onChainStateLoading ? onChainState.currency : ""
            }
          />
          <DetailsRow
            title="Hook"
            value={
              onChainState && !onChainStateLoading
                ? truncateAddress(onChainState.hook)
                : loadingOrValue(onChainStateLoading, null)
            }
            copyValue={
              onChainState && !onChainStateLoading ? onChainState.hook : ""
            }
          />
          {sender && (
            <DetailsRow
              title="Payer"
              value={formatAddress(sender)}
              copyValue={sender}
            />
          )}
          {receiver && (
            <DetailsRow
              title="Recipient"
              value={formatAddress(receiver)}
              copyValue={receiver}
            />
          )}
        </VStack>
      </RoundedBox>

      <RoundedBox px={6} py={4}>
        <Heading size="sm" mb={3}>
          Metadata
        </Heading>
        {metadataLoading && !metadata ? (
          <Text fontSize="sm" color="gray.500">
            Loading metadata…
          </Text>
        ) : (
          <>
            {metadata?.image && (
              <Center mb={4}>
                <Image
                  src={metadata.image}
                  alt={metadata.name ?? `Nota ${notaId}`}
                  maxH="200px"
                  borderRadius="md"
                  objectFit="contain"
                />
              </Center>
            )}
            {metadata?.description && (
              <Text fontSize="sm" mb={4} whiteSpace="pre-wrap">
                {metadata.description}
              </Text>
            )}
            {displayAttributes.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={2} mb={4}>
                {displayAttributes.map((attribute, index) => (
                  <Tag key={`${attribute.trait_type}-${index}`} size="md">
                    {attribute.trait_type}:{" "}
                    {formatMetadataAttributeValue(attribute)}
                  </Tag>
                ))}
              </Stack>
            )}
            {metadata?.external_url && (
              <Link
                href={metadata.external_url}
                isExternal
                color="blue.500"
                fontSize="sm"
              >
                External link <ExternalLinkIcon mx="2px" />
              </Link>
            )}
            {!metadata && !metadataLoading && (
              <Text fontSize="sm" color="gray.500">
                No readable metadata found for this nota.
              </Text>
            )}
          </>
        )}
      </RoundedBox>

      <RoundedBox px={6} py={4}>
        <NotaInteractionLog
          interactions={interactions}
          interactionsLoading={interactionsLoading}
          interactionsSource={interactionsSource}
        />
      </RoundedBox>
    </VStack>
  );
}

export default NotaInfoScreen;
