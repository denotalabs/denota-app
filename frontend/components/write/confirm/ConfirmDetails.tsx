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
  const { formData } = useNotaForm();
  const { formatAddress } = useFormatAddress();

  const { displayNameForCurrency } = useCurrencyDisplayName();

  return (
    <RoundedBox p={6}>
      <VStack>
        <DetailsRow
          title="Client address"
          value={formatAddress(formData.address)}
        />
        <DetailsRow
          title="Payment Amount"
          value={
            formData.amount +
            " " +
            displayNameForCurrency(formData.token as CheqCurrency)
          }
        />
        {formData.module === "direct" && isInvoice && (
          <DetailsRow title="Due Date" value={formData.dueDate} />
        )}
        {formData.module === "escrow" && (
          <DetailsRow
            title="Inspector"
            value={
              formData.auditor ? formatAddress(formData.auditor) : "Self-signed"
            }
          />
        )}
      </VStack>
    </RoundedBox>
  );
}

export default ConfirmDetails;
