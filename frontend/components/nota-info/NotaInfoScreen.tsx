import {
  ArrowBackIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon,
  ExternalLinkIcon,
  TimeIcon
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  Center,
  Collapse,
  Flex,
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
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import {
  blockExplorerAddressUrl,
} from "../../context/config/chains";
import { useEnsNames } from "../../hooks/useEnsNames";
import { NotaInfoData } from "../../hooks/useNotaInfo";
import { POLYGON_REGISTRAR_ADDRESS } from "../../hooks/usePublicNotas";
import { ipfsToHttpUrl } from "../../utils/ipfsGateway";
import { hookDisplayName } from "../../utils/notaActions/hookRegistry";
import {
  extractInspectorFromMetadata,
  extractPayerFromMetadata,
} from "../../utils/notaActions/metadataRoles";
import {
  collectMetadataAddresses,
  formatMetadataAttributeValue,
  isMetadataAddressValue,
  resolveMetadataImageUrl,
  TokenMetadataAttribute,
} from "../../utils/notaTokenUri";
import AddressDisplay from "../designSystem/AddressDisplay";
import NotaActions from "../nota-actions/NotaActions";
import EscrowAgreementCard from "./EscrowAgreementCard";
import { notaInfoTheme as t } from "./notaInfoTheme";
import NotaInteractionLog from "./NotaInteractionLog";
import ParticipantsCard, { Participant } from "./ParticipantsCard";

interface Props {
  notaId: string;
  data: NotaInfoData;
  onRefresh: () => void;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function truncateMiddle(value: string, head = 6, tail = 4): string {
  if (!value || value.length <= head + tail + 1) {
    return value;
  }
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <Heading
      as="h3"
      fontSize="sm"
      fontWeight={500}
      color={t.textBright}
      mb="11px"
    >
      {children}
    </Heading>
  );
}

function CopyGlyph({ value, label }: { value: string; label: string }) {
  const { onCopy } = useClipboard(value);
  const toast = useToast();

  return (
    <Tooltip label={label} placement="top" shouldWrapChildren>
      <CopyIcon
        boxSize={3.5}
        cursor="pointer"
        color={t.muted}
        _hover={{ color: t.primaryLight }}
        onClick={() => {
          onCopy();
          toast({
            title: "Copied",
            status: "success",
            duration: 1000,
            isClosable: true,
          });
        }}
      />
    </Tooltip>
  );
}

function KVRow({
  label,
  isLast,
  children,
}: {
  label: string;
  isLast?: boolean;
  children: ReactNode;
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      gap={3}
      py={3}
      borderBottom={isLast ? "none" : "0.5px solid"}
      borderColor={t.line}
      fontSize="13.5px"
    >
      <Text color={t.muted} flexShrink={0}>
        {label}
      </Text>
      <HStack spacing={2} minW={0}>
        {children}
      </HStack>
    </Flex>
  );
}

function ExternalKVLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      isExternal
      color={t.primaryLight}
      display="inline-flex"
      alignItems="center"
      gap="6px"
      _hover={{ textDecoration: "none", color: t.textBright }}
      noOfLines={1}
    >
      {children} <ExternalLinkIcon boxSize={3} flexShrink={0} />
    </Link>
  );
}

function MetadataImage({ imageURI, alt }: { imageURI: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const src = resolveMetadataImageUrl(imageURI);

  useEffect(() => {
    setFailed(false);
  }, [imageURI]);

  if (failed) {
    return null;
  }

  return (
    <Center py={3}>
      <Image
        src={src}
        alt={alt}
        maxH="200px"
        borderRadius="10px"
        objectFit="contain"
        onError={() => setFailed(true)}
      />
    </Center>
  );
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

  if (!isMetadataAddressValue(value)) {
    return (
      <Text color={t.text} noOfLines={1}>
        {formatMetadataAttributeValue(attribute)}
      </Text>
    );
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
      <CopyGlyph value={value} label="Copy address" />
      <Tooltip label="View on block explorer" placement="top" shouldWrapChildren>
        <Link
          href={blockExplorerAddressUrl(explorerTxBase, value)}
          isExternal
          aria-label="View on block explorer"
          display="inline-flex"
          color={t.muted}
          _hover={{ color: t.primaryLight }}
          lineHeight={0}
        >
          <ExternalLinkIcon boxSize={3} />
        </Link>
      </Tooltip>
    </HStack>
  );
}

function NotaInfoScreen({ notaId, data, onRefresh }: Props) {
  const shortenAddresses =
    useBreakpointValue({ base: true, md: false }) ?? false;
  const detailsDisclosure = useDisclosure({ defaultIsOpen: false });
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
    interactions,
    interactionsLoading,
    interactionsSource,
  } = data;

  const payerFromMetadata = useMemo(
    () => extractPayerFromMetadata(metadata),
    [metadata]
  );
  const inspectorFromMetadata = useMemo(
    () => extractInspectorFromMetadata(metadata),
    [metadata]
  );
  const ensAddresses = useMemo(
    () =>
      [
        owner,
        approved,
        onChainState?.hook,
        payerFromMetadata,
        inspectorFromMetadata,
        ...collectMetadataAddresses(metadata),
      ].filter((address): address is string => !!address),
    [owner, approved, onChainState, payerFromMetadata, inspectorFromMetadata, metadata]
  );
  const ensNames = useEnsNames(ensAddresses);

  const hookName = onChainState ? hookDisplayName(onChainState.hook) : null;

  if (data.notFound && !ownerLoading) {
    return (
      <VStack spacing={4} py={10}>
        <Text>{data.error ?? "Payment not found"}</Text>
        <Button as={NextLink} href="/dashboard" leftIcon={<ArrowBackIcon />}>
          Back to dashboard
        </Button>
      </VStack>
    );
  }

  const openSeaUrl = `https://opensea.io/assets/matic/${POLYGON_REGISTRAR_ADDRESS}/${notaId}`;

  const hasApproved = !!approved && approved !== ZERO_ADDRESS;
  const escrowHeld =
    !!onChainState && !onChainState.escrowWei.isZero();

  const participants: Participant[] = [
    ...(payerFromMetadata
      ? [
        {
          name: "Payer",
          description: "Funded the escrow",
          address: payerFromMetadata,
        },
      ]
      : []),
    {
      name: "Recipient",
      description: "Receives funds if released",
      address: owner,
    },
    ...(inspectorFromMetadata
      ? [
        {
          name: "Arbitrator",
          description: "Decides the outcome",
          address: inspectorFromMetadata,
        },
      ]
      : []),
    {
      name: "Approved",
      description: hasApproved
        ? "Can act on the owner's behalf"
        : "None set",
      address: hasApproved ? approved : null,
    },
  ];

  // Addresses already shown in the Participants list — attribute tags that
  // repeat them are redundant and get filtered out of Additional details.
  const participantAddresses = new Set(
    participants
      .map((participant) => participant.address?.toLowerCase())
      .filter((address): address is string => !!address)
  );
  const displayAttributes = (metadata?.attributes ?? []).filter(
    (attribute) =>
      !(
        isMetadataAddressValue(attribute.value) &&
        participantAddresses.has(attribute.value.toLowerCase())
      )
  );

  return (
    <Box
      width="95%"
      maxW="56rem"
      mt={{ base: 6, lg: 10 }}
      mb={10}
      p={{ base: 4, md: "24px 26px" }}
      bg={t.pageBg}
      border="0.5px solid"
      borderColor={t.line}
      borderRadius="16px"
      color={t.text}
    >
      <Link
        as={NextLink}
        href="/dashboard"
        display="inline-flex"
        alignItems="center"
        gap="7px"
        fontSize="13px"
        color={t.muted}
        mb="18px"
        _hover={{ textDecoration: "none", color: t.textBright }}
      >
        <ArrowBackIcon boxSize={4} /> Dashboard
      </Link>

      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "flex-start" }}
        spacing={4}
      >
        <Box>
          <Flex align="center" gap="11px" flexWrap="wrap">
            <Heading
              as="h1"
              fontSize="23px"
              fontWeight={500}
              color={t.textBright}
            >
              Payment #{notaId}
            </Heading>
            {onChainState && !onChainStateLoading && (
              <Tag
                fontSize="11.5px"
                px="11px"
                py={1}
                borderRadius="full"
                bg={t.primaryDim}
                color={t.primaryLight}
                border="0.5px solid"
                borderColor={t.line}
              >
                {escrowHeld ? (
                  <TimeIcon boxSize={3} mr={1} />
                ) : (
                  <CheckCircleIcon boxSize={3} mr={1} />
                )}
                {escrowHeld ? "Awaiting release" : "Not funded"}
              </Tag>
            )}
          </Flex>
          <Text mt="7px" fontSize="13.5px" color={t.muted}>
            {hookName ? `${hookName} Nota` : "Nota"}
          </Text>
        </Box>
        <Link
          href={openSeaUrl}
          isExternal
          fontSize="13px"
          px="13px"
          py={2}
          border="0.5px solid"
          borderColor={t.line}
          borderRadius="10px"
          color={t.text}
          whiteSpace="nowrap"
          display="inline-flex"
          alignItems="center"
          gap="6px"
          alignSelf={{ base: "flex-start", md: "flex-start" }}
          _hover={{ textDecoration: "none", borderColor: t.primary }}
        >
          <ExternalLinkIcon boxSize={3.5} /> OpenSea
        </Link>
      </Stack>

      <Box my="22px">
        <EscrowAgreementCard
          escrow={onChainState?.escrow ?? null}
          currencySymbol={onChainState?.currencySymbol ?? null}
          currencyDecimals={onChainState?.currencyDecimals ?? null}
          hasPayer={!!payerFromMetadata}
          hasInspector={!!inspectorFromMetadata}
          hook={onChainState?.hook ?? null}
          metadata={metadata}
          ensNames={ensNames}
          explorerTxBase={explorerTxBase}
          moduleDescription={metadata?.description ?? null}
          isLoading={onChainStateLoading}
          isEmpty={!escrowHeld}
        />
      </Box>

      <Box mb={6}>
        <NotaActions notaId={notaId} data={data} onRefresh={onRefresh} />
      </Box>

      <SectionHeading>Participants</SectionHeading>
      <Box mb={6}>
        <ParticipantsCard
          participants={participants}
          ensNames={ensNames}
          shortenAddresses={shortenAddresses}
          explorerTxBase={explorerTxBase}
        />
      </Box>

      <Flex
        as="button"
        type="button"
        onClick={detailsDisclosure.onToggle}
        align="center"
        gap="7px"
        w="100%"
        textAlign="left"
        mb={detailsDisclosure.isOpen ? "11px" : 0}
        aria-expanded={detailsDisclosure.isOpen}
      >
        <Heading as="h3" fontSize="sm" fontWeight={500} color={t.textBright}>
          Additional details
        </Heading>
        {detailsDisclosure.isOpen ? (
          <ChevronUpIcon boxSize={4} color={t.muted} />
        ) : (
          <ChevronDownIcon boxSize={4} color={t.muted} />
        )}
      </Flex>
      <Collapse in={detailsDisclosure.isOpen} animateOpacity>
        <Box px={{ base: 0, md: "2px" }} py={1}>
          {metadataLoading && !metadata ? (
            <Text fontSize="13.5px" color={t.muted2} py={3}>
              Loading metadata…
            </Text>
          ) : (
            <>
              {metadata?.image && (
                <MetadataImage
                  imageURI={metadata.image}
                  alt={metadata.name ?? `Nota ${notaId}`}
                />
              )}
              {metadata?.name && (
                <KVRow label="Name">
                  <Text color={t.text} noOfLines={1}>
                    {metadata.name}
                  </Text>
                </KVRow>
              )}
              {onChainState && !onChainStateLoading && (
                <KVRow label="Currency">
                  <Text fontFamily="mono" fontSize="12.5px" color={t.text}>
                    {onChainState.currencySymbol}
                  </Text>
                  <Text color={t.muted}>
                    · {truncateMiddle(onChainState.currency)}
                  </Text>
                  <CopyGlyph
                    value={onChainState.currency}
                    label="Copy currency address"
                  />
                  <Tooltip
                    label="View on block explorer"
                    placement="top"
                    shouldWrapChildren
                  >
                    <Link
                      href={blockExplorerAddressUrl(
                        explorerTxBase,
                        onChainState.currency
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
                </KVRow>
              )}
              {onChainState && !onChainStateLoading && (
                <KVRow label="Hook">
                  <Text color={t.muted}>
                    {truncateMiddle(onChainState.hook)}
                  </Text>
                  <CopyGlyph
                    value={onChainState.hook}
                    label="Copy hook address"
                  />
                  <Tooltip
                    label="View on block explorer"
                    placement="top"
                    shouldWrapChildren
                  >
                    <Link
                      href={blockExplorerAddressUrl(
                        explorerTxBase,
                        onChainState.hook
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
                </KVRow>
              )}
              {metadata?.external_url && (
                <KVRow label="Document">
                  <ExternalKVLink href={ipfsToHttpUrl(metadata.external_url)}>
                    {truncateMiddle(
                      metadata.external_url.replace(/^https?:\/\//, ""),
                      24,
                      6
                    )}
                  </ExternalKVLink>
                </KVRow>
              )}
              {metadata?.image && (
                <KVRow label="Image">
                  <ExternalKVLink href={resolveMetadataImageUrl(metadata.image)}>
                    {truncateMiddle(metadata.image, 12, 6)}
                  </ExternalKVLink>
                </KVRow>
              )}
              {displayAttributes.map((attribute, index) => (
                <KVRow
                  key={`${attribute.trait_type}-${index}`}
                  label={attribute.trait_type ?? "Attribute"}
                >
                  <MetadataAttributeValue
                    attribute={attribute}
                    ensNames={ensNames}
                    shortenAddresses={shortenAddresses}
                    explorerTxBase={explorerTxBase}
                  />
                </KVRow>
              ))}
              {!metadata && !metadataLoading && !onChainState && (
                <Text fontSize="13.5px" color={t.muted2} py={3}>
                  No readable metadata found for this nota.
                </Text>
              )}
            </>
          )}

          {interactionsLoading || interactions.length > 0 ? (
            <>
              <Text fontSize="13.5px" color={t.muted} pt={4} pb={1}>
                History
              </Text>
              <NotaInteractionLog
                interactions={interactions}
                interactionsLoading={interactionsLoading}
                interactionsSource={interactionsSource}
              />
            </>
          ) : (
            <KVRow label="History" isLast>
              <Text color={t.muted2}>Unavailable, subgraph offline</Text>
            </KVRow>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export default NotaInfoScreen;
