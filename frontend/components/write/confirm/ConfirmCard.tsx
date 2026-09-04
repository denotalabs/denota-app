import { Box, Flex, Link, Text } from "@chakra-ui/react";
import { isAddress } from "ethers/lib/utils";
import { Lock } from "lucide-react";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useEnsNames } from "../../../hooks/useEnsNames";
import { useTokens } from "../../../hooks/useTokens";
import { attachmentFileName } from "../../../utils/attachmentLink";
import { getEffectiveAddress } from "../../../utils/ensAddress";
import { ipfsToHttpUrl } from "../../../utils/ipfsGateway";
import { normalizePaymentMetadataUris } from "../../../utils/metadataUri";
import {
  buildConfirmPreview,
  resolvePartyLabel,
  type ConfirmDetailRow,
  type ConfirmPreview,
  type NarrativeSegment,
} from "../../../utils/paymentTerms/confirmPreview";
import type { PaymentTermsValues } from "../../../utils/paymentTerms/types";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import { formTheme } from "../../designSystem/form/formTheme";

interface Props {
  signatureCount: number;
  gasLabel: string;
}

function Narrative({ segments }: { segments: NarrativeSegment[] }) {
  return (
    <Text
      fontSize="15px"
      lineHeight="1.65"
      color={formTheme.text}
      mb={5}
    >
      {segments.map((segment, index) =>
        segment.kind === "bold" ? (
          <Text as="span" key={index} fontWeight={700}>
            {segment.text}
          </Text>
        ) : (
          <Text as="span" key={index} fontWeight={400}>
            {segment.text}
          </Text>
        )
      )}
    </Text>
  );
}

function DetailRow({
  row,
  accent,
}: {
  row: ConfirmDetailRow;
  accent?: boolean;
}) {
  const labelColor = accent ? formTheme.termsAccent : formTheme.muted;
  const valueColor = accent ? formTheme.termsAccent : formTheme.text;
  const value = (
    <Flex align="center" justify="flex-end" gap={1.5} minW={0}>
      {row.showLock ? (
        <Box color={labelColor} flexShrink={0} display="inline-flex">
          <Lock size={13} strokeWidth={2.25} />
        </Box>
      ) : null}
      {row.href ? (
        <Link
          href={row.href}
          isExternal
          fontSize="14px"
          fontWeight={700}
          color={valueColor}
          noOfLines={1}
          textAlign="right"
          _hover={{ textDecoration: "underline" }}
        >
          {row.value}
        </Link>
      ) : (
        <Text
          fontSize="14px"
          fontWeight={700}
          color={valueColor}
          noOfLines={1}
          textAlign="right"
        >
          {row.value}
        </Text>
      )}
    </Flex>
  );

  return (
    <Flex
      direction="column"
      py={2}
      w="100%"
      color={accent ? formTheme.termsAccent : undefined}
    >
      <Flex justify="space-between" align="flex-start" gap={4} w="100%">
        <Text
          fontSize="14px"
          fontWeight={accent ? 600 : 500}
          color={labelColor}
          flexShrink={0}
        >
          {row.label}
        </Text>
        <Box minW={0}>{value}</Box>
      </Flex>
      {row.hint ? (
        <Text
          fontSize="12px"
          color={formTheme.mutedFaded}
          textAlign="right"
          mt={0.5}
        >
          {row.hint}
        </Text>
      ) : null}
    </Flex>
  );
}

function ConfirmLegend({ label }: { label: string }) {
  return (
    <Flex align="center" gap={2} mt={3} px={1}>
      <Box
        w="8px"
        h="8px"
        borderRadius="2px"
        bg={formTheme.termsAccent}
        flexShrink={0}
      />
      <Text fontSize="12px" color={formTheme.muted}>
        {label}
      </Text>
    </Flex>
  );
}

function usePreview(): ConfirmPreview {
  const { notaFormValues, file } = useNotaForm();
  const { displayNameForCurrency } = useTokens();

  const recipientTyped = String(notaFormValues.address ?? "");
  const recipientResolved = String(notaFormValues.resolvedAddress ?? "");
  const terms = notaFormValues.terms as PaymentTermsValues | undefined;

  const ensAddresses = useMemo(() => {
    const addresses: string[] = [];
    const recipient = getEffectiveAddress(recipientTyped, recipientResolved);
    if (isAddress(recipient)) {
      addresses.push(recipient);
    }
    const reviewer = getEffectiveAddress(
      terms?.reviewerAddress ?? "",
      terms?.resolvedReviewerAddress
    );
    if (isAddress(reviewer)) {
      addresses.push(reviewer);
    }
    const collection = terms?.nftCollectionAddress?.trim() ?? "";
    if (isAddress(collection)) {
      addresses.push(collection);
    }
    return addresses;
  }, [
    recipientResolved,
    recipientTyped,
    terms?.nftCollectionAddress,
    terms?.resolvedReviewerAddress,
    terms?.reviewerAddress,
  ]);
  const ensNames = useEnsNames(ensAddresses);

  const { externalURI, imageURI } = useMemo(
    () => normalizePaymentMetadataUris(notaFormValues),
    [notaFormValues.externalURI, notaFormValues.imageURI]
  );

  const recipientLabel = resolvePartyLabel(
    recipientTyped,
    recipientResolved,
    ensNames,
    "the recipient"
  );

  const tokenLabel = displayNameForCurrency(
    (notaFormValues.token as NotaCurrency) ?? "UNKNOWN"
  );

  const documentUrl = externalURI ? ipfsToHttpUrl(externalURI) : undefined;
  const imageUrl = imageURI ? ipfsToHttpUrl(imageURI) : undefined;

  return buildConfirmPreview(terms, {
    recipientLabel,
    amount: notaFormValues.amount,
    tokenLabel,
    documentUrl,
    documentLabel: externalURI
      ? attachmentFileName(externalURI, file?.name)
      : undefined,
    imageUrl,
    imageLabel: imageURI ? attachmentFileName(imageURI) : undefined,
    ensNames,
  });
}

export function ConfirmCard({ signatureCount, gasLabel }: Props) {
  const preview = usePreview();
  const hasTerms = preview.termRows.length > 0;
  const signatureLabel =
    signatureCount === 1
      ? "1 wallet signature"
      : `${signatureCount} wallet signatures`;

  return (
    <Box>
      <Box
        bg="brand.600"
        border="1px solid"
        borderColor="brand.500"
        borderRadius="16px"
        px={5}
        py={5}
        w="100%"
      >
        <Narrative segments={preview.narrative} />

        <Flex direction="column">
          {preview.sharedRows.map((row) => (
            <DetailRow key={row.label} row={row} />
          ))}
        </Flex>

        {hasTerms ? (
          <>
            <Box h="1px" bg="brand.500" my={3} />
            <Flex direction="column">
              {preview.termRows.map((row) => (
                <DetailRow key={row.label} row={row} accent />
              ))}
            </Flex>
          </>
        ) : null}

        <Box
          borderTop="1px dashed"
          borderColor="brand.500"
          mt={3}
          pt={3}
        >
          <Flex justify="space-between" align="baseline" gap={3}>
            <Text fontSize="14px" fontWeight={700} color={formTheme.textDark}>
              {signatureLabel}
            </Text>
            <Text fontSize="13px" color={formTheme.muted}>
              {gasLabel}
            </Text>
          </Flex>
        </Box>
      </Box>
      {preview.legend ? <ConfirmLegend label={preview.legend} /> : null}
    </Box>
  );
}
