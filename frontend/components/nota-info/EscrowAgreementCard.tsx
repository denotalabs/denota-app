import { ArrowUpIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { Box, Flex, HStack, Link, Text, Tooltip } from "@chakra-ui/react";
import { useMemo } from "react";
import { BsBook, BsCode } from "react-icons/bs";
import { blockExplorerContractCodeUrl } from "../../context/config/chains";
import {
  AgreementRole,
  buildAgreementStory,
} from "../../utils/notaAgreementStory";
import { TokenMetadata } from "../../utils/notaTokenUri";
import { notaInfoTheme as t } from "../designSystem/notaInfoTheme";

interface Props {
  escrow: string | null;
  currencySymbol: string | null;
  currencyDecimals: number | null;
  hasPayer: boolean;
  hasInspector: boolean;
  hook: string | null;
  metadata: TokenMetadata | null;
  ensNames: Map<string, string | null>;
  explorerTxBase: string;
  metadataDescription: string | null;
  isLoading: boolean;
  /** True when the escrow balance is zero (nothing funded yet). */
  isEmpty: boolean;
}

/** A role word ("the recipient") styled to hint it maps to the Participants list. */
function Role({ children }: { children: string }) {
  return (
    <Text
      as="span"
      color={t.primaryLight}
      fontWeight={500}
      borderBottom="1px dotted"
      borderColor={t.line}
    >
      {children}
    </Text>
  );
}

function EscrowAgreementCard({
  escrow,
  currencySymbol,
  currencyDecimals,
  hasPayer,
  hasInspector,
  hook,
  metadata,
  ensNames,
  explorerTxBase,
  metadataDescription,
  isLoading,
  isEmpty,
}: Props) {
  const symbolLabel = currencySymbol ?? "";
  const amountLabel = isLoading || escrow === null ? "…" : escrow;
  const showEmpty = !isLoading && escrow !== null && isEmpty;

  const knownRoles: Record<AgreementRole, boolean> = {
    payer: hasPayer,
    recipient: true,
    arbitrator: hasInspector,
  };

  const story = useMemo(
    () =>
      buildAgreementStory({
        hookAddress: hook,
        metadata,
        currencySymbol: currencySymbol ?? "",
        currencyDecimals: currencyDecimals ?? 18,
        isEmpty: showEmpty,
        ensNames,
      }),
    [hook, metadata, currencySymbol, currencyDecimals, showEmpty, ensNames]
  );

  return (
    <Box
      p={{ base: 4, md: "22px" }}
      bg={showEmpty ? t.cardBg : t.heroGradient}
      border="0.5px solid"
      borderColor={t.line}
      borderRadius="14px"
    >
      <Flex
        align="baseline"
        justify="space-between"
        gap={3.5}
        flexWrap="wrap"
        mb={4}
        pb={4}
        borderBottom="0.5px solid"
        borderColor={t.line}
      >
        {showEmpty ? (
          <Box>
            <Text
              fontSize="11px"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color={t.muted}
              mb={1}
            >
              Escrow
            </Text>
            <Text fontSize="16px" fontWeight={500} color={t.muted}>
              No funds escrowed
            </Text>
          </Box>
        ) : (
          <Box>
            <Text
              fontSize="11px"
              letterSpacing="0.08em"
              textTransform="uppercase"
              color={t.primaryLight}
              mb={1}
            >
              Held in escrow
            </Text>
            <Text
              fontSize="34px"
              fontWeight={500}
              color={t.textBright}
              lineHeight={1}
            >
              {amountLabel}{" "}
              <Text as="span" fontSize="18px" color={t.muted} fontWeight={400}>
                {symbolLabel}
              </Text>
            </Text>
          </Box>
        )}
      </Flex>

      <HStack
        spacing={2}
        fontSize="11px"
        letterSpacing="0.08em"
        textTransform="uppercase"
        color={t.primaryLight}
        mb={2.5}
      >
        <BsBook size={13} aria-hidden />
        <Text as="span">The agreement</Text>
        {metadataDescription && (
          <Tooltip
            label={metadataDescription}
            placement="top"
            shouldWrapChildren
            textTransform="none"
            letterSpacing="normal"
          >
            <InfoOutlineIcon
              boxSize={3}
              color={t.muted}
              cursor="help"
              _hover={{ color: t.primaryLight }}
              aria-label="How this payment type works"
            />
          </Tooltip>
        )}
      </HStack>

      <Text fontSize="md" lineHeight={1.75} color={t.storyText}>
        {story.map((segment, index) => {
          if (segment.kind === "amount") {
            return (
              <Text
                as="b"
                key={index}
                fontWeight={500}
                color={t.textBright}
              >
                {amountLabel} {symbolLabel}
              </Text>
            );
          }
          if (segment.kind === "role") {
            return knownRoles[segment.role] ? (
              <Role key={index}>{segment.label}</Role>
            ) : (
              <Text as="span" key={index}>
                {segment.label}
              </Text>
            );
          }
          return (
            <Text as="span" key={index}>
              {segment.text}
            </Text>
          );
        })}
      </Text>

      {hook && (
        <Flex justify="flex-end" mt={3.5}>
          <Link
            href={blockExplorerContractCodeUrl(explorerTxBase, hook)}
            isExternal
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="13px"
            color={t.primaryLight}
            _hover={{ textDecoration: "none", color: t.textBright }}
          >
            <BsCode size={15} aria-hidden /> See exact code{" "}
            <ArrowUpIcon transform="rotate(45deg)" boxSize={3} />
          </Link>
        </Flex>
      )}
    </Box>
  );
}

export default EscrowAgreementCard;
