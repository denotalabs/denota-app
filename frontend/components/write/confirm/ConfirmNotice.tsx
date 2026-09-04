import { Text } from "@chakra-ui/react";
import { isAddress } from "ethers/lib/utils";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useEnsNames } from "../../../hooks/useEnsNames";
import { useTokens } from "../../../hooks/useTokens";
import { getEffectiveAddress } from "../../../utils/ensAddress";
import { buildTermsSummary } from "../../../utils/paymentTerms/summary";
import type { PaymentTermsValues } from "../../../utils/paymentTerms/types";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import RoundedBox from "../../designSystem/RoundedBox";

/**
 * Leads Confirm with a plain-language sentence describing exactly what the
 * chosen terms enforce, so nothing here is a surprise.
 */
function ConfirmNotice() {
  const { notaFormValues } = useNotaForm();
  const { displayNameForCurrency } = useTokens();

  const reviewer = getEffectiveAddress(
    notaFormValues.auditor,
    notaFormValues.resolvedAuditor
  );
  const ensNames = useEnsNames(
    useMemo(() => (isAddress(reviewer) ? [reviewer] : []), [reviewer])
  );

  const terms = notaFormValues.terms as PaymentTermsValues | undefined;
  const story = terms
    ? buildTermsSummary(terms, {
        amount: notaFormValues.amount,
        tokenLabel: displayNameForCurrency(
          notaFormValues.token as NotaCurrency
        ),
        ensNames,
      })
    : "";

  if (!story) {
    return null;
  }

  return (
    <RoundedBox mb={5} padding={6}>
      <Text fontWeight={600} fontSize="xl" textAlign="center">
        Payment story
      </Text>
      <Text fontSize="md" textAlign="center" mt={3} lineHeight="tall">
        {story}
      </Text>
    </RoundedBox>
  );
}

export default ConfirmNotice;
