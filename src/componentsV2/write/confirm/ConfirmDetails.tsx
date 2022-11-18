import { Center, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useStep } from "../../stepper/Stepper";
import ConfirmDetailsRow from "./ConfirmDetailsRow";

function ConfirmDetails() {
  const { formData } = useStep();
  const maturityDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + Number(formData.inspection));
    return date.toDateString();
  }, [formData.inspection]);
  return (
    <VStack borderRadius={10} bg="gray.700" w="100%" p={6}>
      <ConfirmDetailsRow title="Client address" value={formData.address} />
      <ConfirmDetailsRow
        title="Payment Amount"
        value={formData.amount + " " + formData.token}
      />
      <ConfirmDetailsRow title="Maturity Date" value={maturityDate} />
    </VStack>
  );
}

export default ConfirmDetails;
