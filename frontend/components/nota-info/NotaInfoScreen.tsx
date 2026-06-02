import {
  ArrowBackIcon,
  CopyIcon,
  ExternalLinkIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Heading,
  HStack,
  Image,
  Link,
  Stack,
  Tag,
  Text,
  Tooltip,
  useBreakpointValue,
  useClipboard,
  useToast,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import {
  blockExplorerAddressUrl,
  blockExplorerContractCodeUrl,
} from "../../context/config/chains";
import { useEnsNames } from "../../hooks/useEnsNames";
import { NotaInfoData } from "../../hooks/useNotaInfo";
import { POLYGON_REGISTRAR_ADDRESS } from "../../hooks/usePublicNotas";
import {
  collectMetadataAddresses,
  formatMetadataAttributeValue,
  isMetadataAddressValue,
  resolveMetadataImageUrl,
  TokenMetadataAttribute,
} from "../../utils/notaTokenUri";
import AddressDisplay from "../designSystem/AddressDisplay";
import DetailsRow from "../designSystem/DetailsRow";
import RoundedBox from "../designSystem/RoundedBox";
import NotaInteractionLog from "./NotaInteractionLog";

interface Props {
  notaId: string;
  data: NotaInfoData;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function MetadataImage({
  imageURI,
  alt,
}: {
  imageURI: string;
  alt: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = resolveMetadataImageUrl(imageURI);

  useEffect(() => {
    setFailed(false);
  }, [imageURI]);

  if (failed) {
    return (
      <Text fontSize="sm" wordBreak="break-all">
        ImageURI: {imageURI}
      </Text>
    );
  }

  return (
    <Center mb={4}>
      <Image
        src={src}
        alt={alt}
        maxH="200px"
        borderRadius="md"
        objectFit="contain"
        onError={() => setFailed(true)}
      />
    </Center>
  );
}

function loadingOrValue(loading: boolean, value: string | null | undefined): string {
  if (loading) {
    return "…";
  }
  return value ?? "—";
}

function MetadataAttributeValue({
  attribute,
  ensNames,
  shortenAddresses,
  explorerTxBase,
}: {
  attribute: TokenMetadataAttribute;
  ensNames: Map<string, string | null>;
  shortenAddresses: boolean;
  explorerTxBase: string;
}) {
  const { value } = attribute;
  const address = isMetadataAddressValue(value) ? value : "";
  const { onCopy } = useClipboard(address);
  const toast = useToast();

  if (!isMetadataAddressValue(value)) {
    return <>{formatMetadataAttributeValue(attribute)}</>;
  }

  return (
    <HStack as="span" display="inline-flex" spacing={1} alignItems="center">
      <AddressDisplay
        address={value}
        shorten={shortenAddresses}
        ensNames={ensNames}
        as="span"
        display="inline"
      />
      <Tooltip label="Copy address" placement="top" shouldWrapChildren>
        <CopyIcon
          boxSize={3}
          cursor="pointer"
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
      <Tooltip label="View on block explorer" placement="top" shouldWrapChildren>
        <Link
          href={blockExplorerAddressUrl(explorerTxBase, value)}
          isExternal
          aria-label="View on block explorer"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          color="blue.500"
          borderWidth="1px"
          borderColor="blue.500"
          borderRadius="sm"
          p={0.5}
          lineHeight={0}
          _hover={{ bg: "blue.50", textDecoration: "none" }}
        >
          <ExternalLinkIcon boxSize={3} />
        </Link>
      </Tooltip>
    </HStack>
  );
}

function NotaInfoScreen({ notaId, data }: Props) {
  const shortenAddresses =
    useBreakpointValue({ base: true, md: false }) ?? false;
  const { blockchainState } = useBlockchainData();
  const explorerTxBase =
    blockchainState.explorer || "https://polygonscan.com/tx/";
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

  const ensAddresses = useMemo(
    () =>
      [
        owner,
        approved,
        onChainState?.hook,
        sender,
        receiver,
        ...collectMetadataAddresses(metadata),
      ].filter((address): address is string => !!address),
    [owner, approved, onChainState, sender, receiver, metadata]
  );
  const ensNames = useEnsNames(ensAddresses);

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

  const approvedValue =
    approvedLoading
      ? "…"
      : !approved || approved === ZERO_ADDRESS
        ? "None"
        : approved;
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
            shortenAddresses={shortenAddresses}
            ensNames={ensNames}
            value={
              owner && !ownerLoading
                ? owner
                : loadingOrValue(ownerLoading, null)
            }
            copyValue={owner && !ownerLoading ? owner : ""}
            link={
              owner && !ownerLoading
                ? blockExplorerAddressUrl(explorerTxBase, owner)
                : undefined
            }
          />
          <DetailsRow
            title="Approved"
            shortenAddresses={shortenAddresses}
            ensNames={ensNames}
            value={approvedValue}
            copyValue={approvedCopy}
            link={
              approved && approved !== ZERO_ADDRESS
                ? blockExplorerAddressUrl(explorerTxBase, approved)
                : undefined
            }
          />
          <DetailsRow
            title="Escrow"
            shortenAddresses={shortenAddresses}
            value={
              onChainState && !onChainStateLoading
                ? `${onChainState.escrow} ${onChainState.currencySymbol}`
                : loadingOrValue(onChainStateLoading, null)
            }
          />
          <DetailsRow
            title="Currency"
            shortenAddresses={shortenAddresses}
            ensNames={ensNames}
            value={
              onChainState && !onChainStateLoading
                ? onChainState.currency
                : loadingOrValue(onChainStateLoading, null)
            }
            copyValue={
              onChainState && !onChainStateLoading ? onChainState.currency : ""
            }
            link={
              onChainState && !onChainStateLoading
                ? blockExplorerAddressUrl(explorerTxBase, onChainState.currency)
                : undefined
            }
          />
          <DetailsRow
            title="Hook"
            shortenAddresses={shortenAddresses}
            ensNames={ensNames}
            value={
              onChainState && !onChainStateLoading
                ? onChainState.hook
                : loadingOrValue(onChainStateLoading, null)
            }
            copyValue={
              onChainState && !onChainStateLoading ? onChainState.hook : ""
            }
            link={
              onChainState && !onChainStateLoading
                ? blockExplorerContractCodeUrl(explorerTxBase, onChainState.hook)
                : undefined
            }
          />
          {sender && (
            <DetailsRow
              title="Payer"
              shortenAddresses={shortenAddresses}
              ensNames={ensNames}
              value={sender}
              copyValue={sender}
              link={blockExplorerAddressUrl(explorerTxBase, sender)}
            />
          )}
          {receiver && (
            <DetailsRow
              title="Recipient"
              shortenAddresses={shortenAddresses}
              ensNames={ensNames}
              value={receiver}
              copyValue={receiver}
              link={blockExplorerAddressUrl(explorerTxBase, receiver)}
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
            {metadata?.name && (
              <Text fontSize="sm" mb={metadata?.image ? 2 : 4}>
                Name: {metadata.name}
              </Text>
            )}
            {metadata?.image && (
              <MetadataImage
                imageURI={metadata.image}
                alt={metadata.name ?? `Nota ${notaId}`}
              />
            )}
            {metadata?.description && (
              <Text fontSize="sm" my={4} whiteSpace="pre-wrap">
                {metadata.description}
              </Text>
            )}
            {displayAttributes.length > 0 && (
              <Stack direction="row" flexWrap="wrap" gap={2} mb={4}>
                {displayAttributes.map((attribute, index) => (
                  <Tag key={`${attribute.trait_type}-${index}`} size="md">
                    {attribute.trait_type}:{" "}
                    <MetadataAttributeValue
                      attribute={attribute}
                      ensNames={ensNames}
                      shortenAddresses={shortenAddresses}
                      explorerTxBase={explorerTxBase}
                    />
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
