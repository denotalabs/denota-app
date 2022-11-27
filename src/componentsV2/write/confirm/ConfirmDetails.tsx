import { Center, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useStep } from "../../stepper/Stepper";
import RoundedBox from "../RoundedBox";
import ConfirmDetailsRow from "./ConfirmDetailsRow";

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
        <ConfirmDetailsRow title="Client address" value={formData.address} />
        <ConfirmDetailsRow
          title="Payment Amount"
          value={formData.amount + " " + formData.token}
        />
        <ConfirmDetailsRow title="Maturity Date" value={maturityDate} />
      </VStack>
    </RoundedBox>
  );
}

export default ConfirmDetails;
