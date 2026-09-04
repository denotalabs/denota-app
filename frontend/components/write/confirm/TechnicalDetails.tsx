import {
  Box,
  Collapse,
  Flex,
  IconButton,
  Link,
  Text,
  useClipboard,
} from "@chakra-ui/react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import {
  blockExplorerContractCodeUrl,
  DEFAULT_CHAIN_ID,
} from "../../../context/config/chains";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useTokens } from "../../../hooks/useTokens";
import { buildTechnicalDetails } from "../../../utils/paymentTerms/technicalDetails";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import { DisclosureToggle } from "../../designSystem/form/DisclosureToggle";
import { formTheme } from "../../designSystem/form/formTheme";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  /** True when an ERC-20 approval must be signed before the write. */
  needsApproval: boolean;
  tokenLabel: string;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box>
      <Text
        fontSize="11px"
        fontWeight={700}
        letterSpacing="0.4px"
        textTransform="uppercase"
        color={formTheme.mutedFaded}
        mb={1}
      >
        {label}
      </Text>
      {children}
    </Box>
  );
}

function MonoValue({ value }: { value: string }) {
  const { onCopy, hasCopied } = useClipboard(value);
  return (
    <Flex align="flex-start" gap={2}>
      <Text
        flex={1}
        minW={0}
        fontFamily="mono"
        fontSize="12px"
        lineHeight={1.5}
        color={formTheme.text}
        wordBreak="break-all"
      >
        {value}
      </Text>
      <IconButton
        aria-label={hasCopied ? "Copied" : "Copy"}
        size="xs"
        variant="ghost"
        flexShrink={0}
        icon={hasCopied ? <Check size={13} /> : <Copy size={13} />}
        onClick={onCopy}
      />
    </Flex>
  );
}

/**
 * Collapsed by default. The only place in the flow that names the resolved
 * hook contract, its address, and the encoded hookData.
 */
export function TechnicalDetails({ needsApproval, tokenLabel }: Props) {
  const [open, setOpen] = useState(false);
  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();
  const { getTokenUnits } = useTokens();

  const chainId = blockchainState.chainIdNumber || DEFAULT_CHAIN_ID;
  const token = (notaFormValues.token as NotaCurrency) ?? "UNKNOWN";

  const details = useMemo(
    () =>
      buildTechnicalDetails({
        notaFormValues,
        chainId,
        connectedAccount: blockchainState.account ?? "",
        tokenDecimals: getTokenUnits(token),
      }),
    [blockchainState.account, chainId, getTokenUnits, notaFormValues, token]
  );

  if (!details) {
    return null;
  }

  const explorerUrl = details.hookAddress
    ? blockExplorerContractCodeUrl(
        blockchainState.explorer,
        details.hookAddress
      )
    : null;

  return (
    <RoundedBox mt={4} px={5} py={3}>
      <DisclosureToggle
        label="Technical details"
        open={open}
        onToggle={() => setOpen((value) => !value)}
        w="100%"
      />
      <Collapse in={open} animateOpacity>
        <Flex direction="column" gap={3.5} pt={3} pb={1}>
          {needsApproval ? (
            <Box
              px={3}
              py={2.5}
              borderRadius="8px"
              bg="gray.50"
              borderLeft="3px solid"
              borderLeftColor="brand.200"
            >
              <Text fontSize="13px" lineHeight={1.5} color={formTheme.text}>
                This payment needs two signatures: one to approve {tokenLabel}{" "}
                for the registrar, then one to create the payment.
              </Text>
            </Box>
          ) : null}
          <Row label="Hook contract">
            <Text fontSize="14px" fontWeight={600} color={formTheme.text}>
              {details.contractName}
            </Text>
          </Row>
          <Row label="Hook address">
            {details.hookAddress ? (
              <Flex align="center" gap={2}>
                <Box flex={1} minW={0}>
                  <MonoValue value={details.hookAddress} />
                </Box>
                {explorerUrl ? (
                  <Link
                    href={explorerUrl}
                    isExternal
                    display="inline-flex"
                    color="brand.200"
                    aria-label="View hook on block explorer"
                  >
                    <ExternalLink size={14} />
                  </Link>
                ) : null}
              </Flex>
            ) : (
              <Text fontSize="13px" color={formTheme.muted}>
                Not deployed on this network.
              </Text>
            )}
          </Row>
          <Row label="hookData">
            {details.hookData ? (
              <MonoValue value={details.hookData} />
            ) : (
              <Text fontSize="13px" color={formTheme.muted}>
                Encoded when the payment is created.
              </Text>
            )}
          </Row>
          {details.abiTypes.length > 0 ? (
            <Row label="ABI types">
              <Text
                fontFamily="mono"
                fontSize="12px"
                color={formTheme.mutedLight}
              >
                ({details.abiTypes.join(", ")})
              </Text>
            </Row>
          ) : null}
        </Flex>
      </Collapse>
    </RoundedBox>
  );
}
