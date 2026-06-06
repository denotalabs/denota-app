import { VStack } from "@chakra-ui/react";
import { isAddress } from "ethers/lib/utils";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useEnsNames } from "../../../hooks/useEnsNames";
import { useTokens } from "../../../hooks/useTokens";
import {
  BALANCE_OF_CONDITIONAL_CASH_MODULE,
  CONDITION_TYPE_LABELS,
  ConditionType,
} from "../../../utils/balanceOfConditionalCash";
import {
  CASH_BEFORE_DATE_DRIP_MODULE,
  formatDripPeriodFormDisplay,
} from "../../../utils/dripPeriod";
import { getEffectiveAddress } from "../../../utils/ensAddress";
import { formatExpirationDateDisplay } from "../../../utils/expirationDate";
import {
  isReversibleFormModule,
  REVERSIBLE_BEFORE_DATE,
} from "../../../utils/reversibleModule";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

function ConfirmDetails() {
  const { notaFormValues } = useNotaForm();
  const { displayNameForCurrency } = useTokens();

  const recipient = getEffectiveAddress(
    notaFormValues.address,
    notaFormValues.resolvedAddress
  );

  const inspector = getEffectiveAddress(
    notaFormValues.auditor,
    notaFormValues.resolvedAuditor
  );

  const ensAddresses = useMemo(() => {
    const addresses = [recipient];
    if (inspector && isAddress(inspector)) {
      addresses.push(inspector);
    }
    return addresses;
  }, [recipient, inspector]);
  const ensNames = useEnsNames(ensAddresses);

  const showInspector = isReversibleFormModule(notaFormValues.module);
  const showClaimDeadline =
    !!notaFormValues.expirationDate &&
    (notaFormValues.module === "claimable" ||
      notaFormValues.module === "cashBeforeDate" ||
      notaFormValues.module === CASH_BEFORE_DATE_DRIP_MODULE);
  const showDripTerms = notaFormValues.module === CASH_BEFORE_DATE_DRIP_MODULE;
  const showNftBalanceTerms =
    notaFormValues.module === BALANCE_OF_CONDITIONAL_CASH_MODULE;
  const showInspectionEnd =
    !!notaFormValues.inspectionEndDate &&
    isReversibleFormModule(notaFormValues.module) &&
    notaFormValues.recoverableWhen === REVERSIBLE_BEFORE_DATE;

  return (
    <RoundedBox p={6}>
      <VStack>
        <DetailsRow
          title="Recipient address"
          value={recipient}
          ensNames={ensNames}
        />
        <DetailsRow
          title="Payment Amount"
          value={
            notaFormValues.amount +
            " " +
            displayNameForCurrency(notaFormValues.token as NotaCurrency)
          }
        />
        {showInspector && (
          <DetailsRow
            title="Reversible by"
            ensNames={ensNames}
            value={inspector || "Your connected wallet"}
          />
        )}
        {showClaimDeadline && !showDripTerms && (
          <DetailsRow
            title="Must claim before"
            value={formatExpirationDateDisplay(
              notaFormValues.expirationDate ?? ""
            )}
          />
        )}
        {showDripTerms && (
          <>
            <DetailsRow
              title="Drip amount"
              value={
                notaFormValues.dripAmount +
                " " +
                displayNameForCurrency(notaFormValues.token as NotaCurrency)
              }
            />
            <DetailsRow
              title="Drip period"
              value={formatDripPeriodFormDisplay({
                dripPeriodPreset: notaFormValues.dripPeriodPreset,
                dripPeriodAmount: notaFormValues.dripPeriodAmount,
                dripPeriodUnit: notaFormValues.dripPeriodUnit,
              })}
            />
            <DetailsRow
              title="Must claim before"
              value={formatExpirationDateDisplay(
                notaFormValues.expirationDate ?? ""
              )}
            />
          </>
        )}
        {showNftBalanceTerms && (
          <>
            <DetailsRow
              title="NFT collection"
              value={notaFormValues.nftCollectionAddress ?? ""}
            />
            <DetailsRow
              title="Condition"
              value={`${CONDITION_TYPE_LABELS[notaFormValues.conditionType as ConditionType] ?? notaFormValues.conditionType} ${notaFormValues.nftBalanceThreshold}`}
            />
            <DetailsRow
              title="Expiration"
              value={formatExpirationDateDisplay(
                notaFormValues.expirationDate ?? ""
              )}
            />
          </>
        )}
        {showInspectionEnd && (
          <DetailsRow
            title="Inspection end"
            value={formatExpirationDateDisplay(
              notaFormValues.inspectionEndDate ?? ""
            )}
          />
        )}
      </VStack>
    </RoundedBox>
  );
}

export default ConfirmDetails;
