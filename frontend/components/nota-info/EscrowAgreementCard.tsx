import { ArrowUpIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { Box, Flex, HStack, Link, Text, Tooltip } from "@chakra-ui/react";
import { BsBook, BsCode } from "react-icons/bs";
import { blockExplorerContractCodeUrl } from "../../context/config/chains";
import { notaInfoTheme as t } from "./notaInfoTheme";

interface Props {
  escrow: string | null;
  currencySymbol: string | null;
  hasInspector: boolean;
  hook: string | null;
  explorerTxBase: string;
  moduleDescription: string | null;
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
  hasInspector,
  hook,
  explorerTxBase,
  moduleDescription,
  isLoading,
  isEmpty,
}: Props) {
  const symbolLabel = currencySymbol ?? "";
  const amountLabel = isLoading || escrow === null ? "…" : escrow;
  const showEmpty = !isLoading && escrow !== null && isEmpty;

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
        {/* <Text fontSize="12.5px" color={t.muted2} textAlign="right">
          by the Denota protocol
          <br />
          until released or reversed
        </Text> */}
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
        {moduleDescription && (
          <Tooltip
            label={moduleDescription}
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
        {showEmpty ? (
          <>Funds sent to this payment are held in escrow for </>
        ) : (
          <>
            <Text as="b" fontWeight={500} color={t.textBright}>
              {amountLabel} {symbolLabel}
            </Text>{" "}
            is held in escrow for{" "}
          </>
        )}
        <Role>the recipient</Role>.{" "}
        {hasInspector ? (
          <>
            <Role>The arbitrator</Role> may release funds to{" "}
            <Role>the recipient</Role> or reverse them to{" "}
            <Role>the payer</Role> at any time.
          </>
        ) : (
          <>
            Funds release to <Role>the recipient</Role> under the hook&rsquo;s
            conditions, with no arbitrator assigned.
          </>
        )}
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
