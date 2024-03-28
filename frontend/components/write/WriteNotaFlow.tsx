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
}

export function WriteNotaFlow({ onClose }: Props) {
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
        <WriteStepperMobile onClose={onClose} />
      </VStack>
      <VStack
        w="650px"
        bg="brand.100"
        py={2}
        px={4}
        borderRadius="30px"
        display={{ base: "none", md: "flex" }}
      >
        <WriteStepperDesktop onClose={onClose} />
      </VStack>
    </NotaFormProvider>
  );
}

export function WriteStepperDesktop({ onClose }: Props) {
  return (
    <Stepper onClose={onClose}>
      <DetailsStep
        screenKey="write"
        screenTitle={"Payment Details"}
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
      ></ConfirmNotaStep>
    </Stepper>
  );
}

export function WriteStepperMobile({ onClose }: Props) {
  return (
    <Stepper onClose={onClose}>
      <DetailsStep
        screenKey="write"
        screenTitle={"Payment Details"}
        showMetadata={false}
      ></DetailsStep>
      <MetadataStep
        screenKey="metadata"
        screenTitle={"Payment Metadata (Optional)"}
      ></MetadataStep>
      <ModuleSelectStep
        screenKey="moduleSelect"
        screenTitle="Payment Terms"
        showTerms={false}
      />
      <PaymentTermsStep
        screenKey="module"
        screenTitle="Payment Terms"
      ></PaymentTermsStep>
      <ConfirmNotaStep
        screenKey="confirm"
        screenTitle="Confirm"
      ></ConfirmNotaStep>
    </Stepper>
  );
}

export default WriteNotaFlow;
