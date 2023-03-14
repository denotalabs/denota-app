import { VStack } from "@chakra-ui/react";
import { useMemo } from "react";
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

  const inspectionDays = useMemo(() => {
    return Number(formData.inspection) / 86400;
  }, [formData.inspection]);

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
            title="Inspection Period"
            value={inspectionDays + " days"}
          />
        )}
      </VStack>
    </RoundedBox>
  );
}

export default ConfirmDetails;
