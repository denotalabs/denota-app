import { Box, Button, Text } from "@chakra-ui/react";
import { useStep } from "../../stepper/Stepper";
import RoundedButton from "../RoundedButton";
import ConfirmDetails from "./ConfirmDetails";
import ConfirmNotice from "./ConfirmNotice";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqConfirmStep({ isInvoice }: Props) {
  const { onClose, formData } = useStep();

  return (
    <Box w="100%" p={4}>
      <ConfirmNotice isInvoice={isInvoice}></ConfirmNotice>
      <ConfirmDetails></ConfirmDetails>
      <RoundedButton
        onClick={() => {
          console.log({ formData });
          onClose?.();
        }}
      >
        {isInvoice ? "Create Invoice" : "Confirm Payment"}
      </RoundedButton>
    </Box>
  );
}

export default CheqConfirmStep;
