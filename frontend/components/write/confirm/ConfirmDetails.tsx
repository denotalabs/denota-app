import { VStack } from "@chakra-ui/react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useFormatAddress } from "../../../hooks/useFormatAddress";
import { useTokens } from "../../../hooks/useTokens";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

function ConfirmDetails() {
  const { notaFormValues } = useNotaForm();
  const { formatAddress } = useFormatAddress();

  const { displayNameForCurrency } = useTokens();

  return (
    <RoundedBox p={6}>
      <VStack>
        <DetailsRow
          title="Recipient address"
          value={formatAddress(notaFormValues.address)}
        />
        <DetailsRow
          title="Payment Amount"
          value={
            notaFormValues.amount +
            " " +
            displayNameForCurrency(notaFormValues.token as NotaCurrency)
          }
        />
        {notaFormValues.module === "reversibleRelease" || notaFormValues.module === "reversibleByBeforeDate" && (
          <DetailsRow
            title="Inspector"
            value={
              notaFormValues.auditor
                ? formatAddress(notaFormValues.auditor)
                : "Self-signed"
            }
          />
        )}
        {notaFormValues.module === "cashBeforeDate" || notaFormValues.module === "reversibleByBeforeDate" && (
          <DetailsRow
            title="Expiration Date"
            value={notaFormValues.expirationDate}
          />
        )}
      </VStack>
    </RoundedBox>
  );
}

export default ConfirmDetails;
