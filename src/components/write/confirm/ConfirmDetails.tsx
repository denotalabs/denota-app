import { VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedBox from "../../designSystem/RoundedBox";
import { useStep } from "../../designSystem/stepper/Stepper";

interface Props {
  isInvoice: boolean;
}

function ConfirmDetails({ isInvoice }: Props) {
  const { formData } = useStep();
  const inspectionDays = useMemo(() => {
    return Number(formData.inspection) / 86400;
  }, [formData.inspection]);
  return (
    <RoundedBox p={6}>
      <VStack>
        <DetailsRow title="Client address" value={formData.address} />
        <DetailsRow
          title="Payment Amount"
          value={formData.amount + " " + formData.token}
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
