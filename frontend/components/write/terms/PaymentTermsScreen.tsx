import {
  Box,
  Collapse,
  Flex,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Form, Formik, useFormikContext } from "formik";
import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useTokens } from "../../../hooks/useTokens";
import {
  baseTermsValues,
  initialTermsValues,
} from "../../../utils/paymentTerms/defaults";
import { termsToNotaForm } from "../../../utils/paymentTerms/notaFormBridge";
import {
  maturityLabel,
  resolveHook,
} from "../../../utils/paymentTerms/resolveHook";
import type {
  PaymentTermId,
  PaymentTermsFormStatus,
  PaymentTermsValues,
} from "../../../utils/paymentTerms/types";
import { validatePaymentTerms } from "../../../utils/paymentTerms/validate";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import { DisclosureToggle } from "../../designSystem/form/DisclosureToggle";
import { formTheme } from "../../designSystem/form/formTheme";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import { PaymentFlowStepRow } from "../details/PaymentFlowStepRow";
import { AmountChip } from "./AmountChip";
import { ConditionConfig } from "./config/ConditionConfig";
import { MultiplePeopleConfig } from "./config/MultiplePeopleConfig";
import { RecipientClaimsConfig } from "./config/RecipientClaimsConfig";
import { ReleaseOverTimeConfig } from "./config/ReleaseOverTimeConfig";
import { ReviewerConfig } from "./config/ReviewerConfig";
import { SpecializedConfig } from "./config/SpecializedConfig";
import { SpecializedOptions } from "./SpecializedOptions";
import { PromotedTermCard, TermCard, TermSlimRow } from "./TermCard";
import { promotedEntry, TERM_CATALOG } from "./termCatalog";

interface AmountProps {
  amount: string | undefined;
  tokenLabel: string;
}

interface NftErc721Gate {
  address: string;
  isErc721: boolean | null;
}

function nftErc721ForValues(
  values: PaymentTermsValues,
  gate: NftErc721Gate
): boolean | null {
  const address = values.nftCollectionAddress.trim().toLowerCase();
  if (!address || gate.address !== address) {
    return null;
  }
  return gate.isErc721;
}

/** Copies Formik status into the validator ref and re-runs validate when the check settles. */
function SyncNftErc721Gate({
  gateRef,
}: {
  gateRef: MutableRefObject<NftErc721Gate>;
}) {
  const { status, validateForm } = useFormikContext<PaymentTermsValues>();
  const formStatus = status as PaymentTermsFormStatus | undefined;
  const address = formStatus?.erc721Address ?? "";
  const isErc721 = formStatus?.erc721IsErc721 ?? null;

  useEffect(() => {
    const prev = gateRef.current;
    if (prev.address === address && prev.isErc721 === isErc721) {
      return;
    }
    gateRef.current = { address, isErc721 };
    void validateForm();
  }, [address, gateRef, isErc721, validateForm]);

  return null;
}

function TermConfig({ amount, tokenLabel }: AmountProps) {
  const { values } = useFormikContext<PaymentTermsValues>();
  if (values.specialized) {
    return <SpecializedConfig />;
  }
  switch (values.term) {
    case "recipientClaims":
      return <RecipientClaimsConfig />;
    case "someoneReviews":
      return <ReviewerConfig />;
    case "releaseOverTime":
      return <ReleaseOverTimeConfig amount={amount} tokenLabel={tokenLabel} />;
    case "conditionMet":
      return <ConditionConfig />;
    case "payMultiple":
      return <MultiplePeopleConfig amount={amount} tokenLabel={tokenLabel} />;
    default:
      return null;
  }
}

/** The demoted terms: slim rows on desktop, one "Switch term" line on mobile. */
function SwitchList({
  currentTerm,
  onSwitch,
}: {
  currentTerm: PaymentTermId | "";
  onSwitch: (term: PaymentTermId) => void;
}) {
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;
  const [open, setOpen] = useState(false);

  const rows = (
    <Flex direction="column" gap={2}>
      {TERM_CATALOG.filter((entry) => entry.id !== currentTerm).map((entry) => (
        <TermSlimRow
          key={entry.id}
          title={entry.title}
          icon={entry.icon}
          onSelect={() => onSwitch(entry.id)}
        />
      ))}
    </Flex>
  );

  if (isMobile) {
    return (
      <Box mt={4}>
        <DisclosureToggle
          label="Switch term"
          open={open}
          onToggle={() => setOpen((value) => !value)}
          w="100%"
          px={1}
          py={2}
        />
        <Collapse in={open} animateOpacity>
          <Box pt={1}>{rows}</Box>
        </Collapse>
      </Box>
    );
  }

  return (
    <Box mt={5}>
      <Text
        fontSize="12px"
        fontWeight={600}
        letterSpacing="0.3px"
        textTransform="uppercase"
        color={formTheme.mutedFaded}
        mb={2}
        px={1}
      >
        Switch to different terms
      </Text>
      {rows}
    </Box>
  );
}

function TermsBody({ amount, tokenLabel }: AmountProps) {
  const { values, errors, status, setValues, setTouched } =
    useFormikContext<PaymentTermsValues>();

  /** Select (or clear) an option, resetting every field to its seed. */
  const select = useCallback(
    (patch: Partial<Pick<PaymentTermsValues, "term" | "specialized">>) => {
      setValues({ ...baseTermsValues(amount), ...patch });
      setTouched({});
    },
    [amount, setTouched, setValues]
  );

  const promoted = promotedEntry(values.term, values.specialized);
  const resolved = resolveHook(values);
  const formStatus = status as PaymentTermsFormStatus | undefined;
  const nftAddress = values.nftCollectionAddress.trim();
  const nftCheckPending =
    values.term === "conditionMet" &&
    values.conditionTrigger === "ownership" &&
    !values.specialized &&
    nftAddress.length > 0 &&
    formStatus?.erc721IsErc721 !== true;
  const canContinue =
    resolved?.maturity === "live" &&
    Object.keys(errors).length === 0 &&
    !formStatus?.erc721Checking &&
    !nftCheckPending;

  return (
    <Form>
      <Box mb={4}>
        <AmountChip amount={amount} tokenLabel={tokenLabel} />
      </Box>

      {promoted ? (
        <>
          <PromotedTermCard
            title={promoted.title}
            subtitle={promoted.subtitle}
            icon={promoted.icon}
            tag={resolved ? maturityLabel(resolved.maturity) : null}
            onChange={() => select({})}
          >
            <TermConfig amount={amount} tokenLabel={tokenLabel} />
          </PromotedTermCard>
          <SwitchList
            currentTerm={values.term}
            onSwitch={(term) => select({ term })}
          />
          <RoundedButton type="submit" isDisabled={!canContinue} mt={5}>
            Continue
          </RoundedButton>
        </>
      ) : (
        <>
          <Flex direction="column" gap={2.5}>
            {TERM_CATALOG.map((entry) => (
              <TermCard
                key={entry.id}
                title={entry.title}
                subtitle={entry.subtitle}
                icon={entry.icon}
                onSelect={() => select({ term: entry.id })}
              />
            ))}
          </Flex>
          <SpecializedOptions
            onSelect={(specialized) => select({ specialized })}
          />
        </>
      )}
    </Form>
  );
}

/**
 * Payment Terms: choose what should happen in plain language, then configure
 * only the fields that choice needs. Answers resolve to a hook internally;
 * nothing on this screen names a contract.
 */
const PaymentTermsScreen: React.FC<ScreenProps> = () => {
  const { next } = useStep();
  const { notaFormValues, updateNotaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();
  const { displayNameForCurrency } = useTokens();

  const amount = notaFormValues.amount as string | undefined;
  const tokenLabel = displayNameForCurrency(
    (notaFormValues.token as NotaCurrency) ?? "UNKNOWN"
  );

  // Captured once: the screen owns its state until Continue commits it.
  const [initialValues] = useState(() => initialTermsValues(notaFormValues));
  const nftErc721Ref = useRef<NftErc721Gate>({ address: "", isErc721: null });

  const termsContext = useCallback(
    (values: PaymentTermsValues) => ({
      amount,
      tokenLabel,
      nftCollectionIsErc721: nftErc721ForValues(values, nftErc721Ref.current),
    }),
    [amount, tokenLabel]
  );

  return (
    <Box
      w="100%"
      maxW={{ base: "380px", md: "100%" }}
      mx="auto"
      mt={3}
      px={{ base: 4, md: 1 }}
      pb={4}
      color={formTheme.text}
    >
      <PaymentFlowStepRow paymentType="withTerms" activeIndex={1} />
      <Text
        fontSize={{ base: "28px", md: "xl" }}
        fontWeight={700}
        textAlign="center"
        mb={4}
        letterSpacing="-0.5px"
        color={formTheme.textDark}
        display={{ base: "block", md: "none" }}
      >
        Payment Terms
      </Text>
      <Formik
        initialValues={initialValues}
        validate={(values) => validatePaymentTerms(values, termsContext(values))}
        validateOnMount
        onSubmit={(values) => {
          const resolved = resolveHook(values);
          if (resolved?.maturity !== "live" || !resolved.module) {
            return;
          }
          const errors = validatePaymentTerms(values, termsContext(values));
          if (Object.keys(errors).length > 0) {
            return;
          }
          if (
            values.term === "conditionMet" &&
            values.conditionTrigger === "ownership" &&
            nftErc721ForValues(values, nftErc721Ref.current) !== true
          ) {
            return;
          }
          updateNotaFormValues(
            termsToNotaForm(values, blockchainState.account ?? "")
          );
          next?.();
        }}
      >
        <>
          <SyncNftErc721Gate gateRef={nftErc721Ref} />
          <TermsBody amount={amount} tokenLabel={tokenLabel} />
        </>
      </Formik>
    </Box>
  );
};

export default PaymentTermsScreen;
