import { VStack } from "@chakra-ui/react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useCurrencyDisplayName } from "../../../hooks/useCurrencyDisplayName";
import { useFormatAddress } from "../../../hooks/useFormatAddress";
import { CheqCurrency } from "../../designSystem/CurrencyIcon";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";

interface Props {
  isInvoice: boolean;
}

function ConfirmDetails({ isInvoice }: Props) {
  const { notaFormValues } = useNotaForm();
  const { formatAddress } = useFormatAddress();

  const { displayNameForCurrency } = useCurrencyDisplayName();

  return (
    <RoundedBox p={6}>
      <VStack>
        <DetailsRow
          title="Client address"
          value={formatAddress(notaFormValues.address)}
        />
        <DetailsRow
          title="Payment Amount"
          value={
            notaFormValues.amount +
            " " +
            displayNameForCurrency(notaFormValues.token as CheqCurrency)
          }
        />
        {notaFormValues.module === "direct" && isInvoice && (
          <DetailsRow title="Due Date" value={notaFormValues.dueDate} />
        )}
        {notaFormValues.module === "escrow" && (
          <DetailsRow
            title="Inspector"
            value={
              notaFormValues.auditor
                ? formatAddress(notaFormValues.auditor)
                : "Self-signed"
            }
          />
        )}
      </VStack>
    </RoundedBox>
  );
}

export default ConfirmDetails;
