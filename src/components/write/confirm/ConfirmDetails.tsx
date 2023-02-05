import { VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useStep } from "../../designSystem/stepper/Stepper";
import RoundedBox from "../../designSystem/RoundedBox";
import DetailsRow from "../../designSystem/DetailsRow";

function ConfirmDetails() {
  const { formData } = useStep();
  const maturityDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + Number(formData.inspection) / 86400);
    return date.toDateString();
  }, [formData.inspection]);
  return (
    <RoundedBox p={6}>
      <VStack>
        <DetailsRow title="Client address" value={formData.address} />
        <DetailsRow
          title="Payment Amount"
          value={formData.amount + " " + formData.token}
        />
        <DetailsRow title="Maturity Date" value={maturityDate} />
      </VStack>
    </RoundedBox>
  );
}

export default ConfirmDetails;
