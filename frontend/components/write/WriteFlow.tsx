import { HStack, VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../context/NotaFormProvider";
import Stepper from "../designSystem/stepper/Stepper";
import ConfirmStep from "./confirm/ConfirmStep";
import DetailsStep from "./details/DetailsStep";
import MetadataStep from "./metadata/MetadataStep";
import PaymentTermsStep from "./module/PaymentTermsStep";
import ModuleSelectStep from "./moduleSelect/ModuleSelectStep";

interface Props {
  onClose?: () => void;
  isInvoice: boolean;
}

export function WriteFlow({ onClose, isInvoice }: Props) {
  return (
    <NotaFormProvider>
      <VStack
        mt={5}
        bg="brand.100"
        py={2}
        px={4}
        borderRadius="30px"
        display={{ base: "flex", md: "none" }}
      >
        <WriteStepperMobile onClose={onClose} isInvoice={isInvoice} />
      </VStack>
      <HStack
        justifyContent="center"
        alignItems="start"
        w="100%"
        px={10}
        h="100%"
        gap={10}
        display={{ base: "none", md: "flex" }}
      >
        <VStack w="650px" bg="brand.100" py={2} px={4} borderRadius="30px">
          <WriteStepperDesktop onClose={onClose} isInvoice={isInvoice} />
        </VStack>
      </HStack>
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
      <ConfirmStep
        screenKey="confirm"
        screenTitle="Confirm"
        isInvoice={isInvoice}
      ></ConfirmStep>
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
      <ConfirmStep
        screenKey="confirm"
        screenTitle="Confirm"
        isInvoice={isInvoice}
      ></ConfirmStep>
    </Stepper>
  );
}

export default WriteFlow;
