import { VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../context/NotaFormProvider";
import Stepper from "../designSystem/stepper/Stepper";
import ConfirmNotaStep from "./confirm/ConfirmNotaStep";
import DetailsStep from "./details/DetailsStep";
import PaymentTermsScreen from "./terms/PaymentTermsScreen";

interface Props {
  onClose?: () => void;
}

export function WriteNotaFlow({ onClose }: Props) {
  return (
    <NotaFormProvider>
      <VStack
        w="100%"
        maxW={{ base: "100%", md: "520px" }}
        mt={{ base: 0, md: 5 }}
        bg="brand.100"
        py={2}
        px={3}
        borderRadius={{ base: 0, md: "30px" }}
        alignSelf={{ base: "flex-start", md: "auto" }}
        align="stretch"
      >
        <WriteStepper onClose={onClose} />
      </VStack>
    </NotaFormProvider>
  );
}

/** Basic information → Choose and configure payment terms → Confirm. */
export function WriteStepper({ onClose }: Props) {
  return (
    <Stepper onClose={onClose}>
      <DetailsStep screenKey="write" screenTitle="Payment Details" />
      <PaymentTermsScreen screenKey="terms" screenTitle="Payment Terms" />
      <ConfirmNotaStep screenKey="confirm" screenTitle="Confirm" />
    </Stepper>
  );
}

export default WriteNotaFlow;
