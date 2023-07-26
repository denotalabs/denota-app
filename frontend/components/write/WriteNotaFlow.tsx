import { VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../context/NotaFormProvider";
import Stepper from "../designSystem/stepper/Stepper";
import ConfirmNotaStep from "./confirm/ConfirmNotaStep";
import DetailsStep from "./details/DetailsStep";
import MetadataStep from "./metadata/MetadataStep";
import PaymentTermsStep from "./module/PaymentTermsStep";
import ModuleSelectStep from "./moduleSelect/ModuleSelectStep";

interface Props {
  onClose?: () => void;
  isInvoice: boolean;
}

export function WriteNotaFlow({ onClose, isInvoice }: Props) {
  return (
    <NotaFormProvider>
      <VStack
        mt={5}
        bg="brand.100"
        py={2}
        px={4}
        borderRadius="30px"
        display={{ base: "flex", md: "none" }}
        maxW="100%"
      >
        <WriteStepperMobile onClose={onClose} isInvoice={isInvoice} />
      </VStack>
      <VStack w="650px" bg="brand.100" py={2} px={4} borderRadius="30px">
        <WriteStepperDesktop onClose={onClose} isInvoice={isInvoice} />
      </VStack>
    </NotaFormProvider>
  );
}

export function WriteStepperDesktop({ onClose, isInvoice }: Props) {
  return (
    <Stepper onClose={onClose}>
      <DetailsStep
        screenKey="write"
        screenTitle={"Payment Details"}
        isInvoice={isInvoice}
        showMetadata={true}
      ></DetailsStep>
      <ModuleSelectStep
        screenKey="moduleSelect"
        screenTitle="Payment Terms"
        showTerms={true}
      />
      <ConfirmNotaStep
        screenKey="confirm"
        screenTitle="Confirm"
        isInvoice={isInvoice}
      ></ConfirmNotaStep>
    </Stepper>
  );
}

export function WriteStepperMobile({ onClose, isInvoice }: Props) {
  return (
    <Stepper onClose={onClose}>
      <DetailsStep
        screenKey="write"
        screenTitle={"Payment Details"}
        isInvoice={isInvoice}
        showMetadata={false}
      ></DetailsStep>
      <MetadataStep
        screenKey="metadata"
        screenTitle={"Payment Metadata (Optional)"}
      ></MetadataStep>
      <ModuleSelectStep
        screenKey="moduleSelect"
        screenTitle="Payment Module"
        showTerms={false}
      />
      <PaymentTermsStep
        screenKey="module"
        screenTitle="Payment Terms"
        isInvoice={isInvoice}
      ></PaymentTermsStep>
      <ConfirmNotaStep
        screenKey="confirm"
        screenTitle="Confirm"
        isInvoice={isInvoice}
      ></ConfirmNotaStep>
    </Stepper>
  );
}

export default WriteNotaFlow;
