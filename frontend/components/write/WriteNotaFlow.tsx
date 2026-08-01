import { VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../context/NotaFormProvider";
import Stepper from "../designSystem/stepper/Stepper";
import ConfirmNotaStep from "./confirm/ConfirmNotaStep";
import DetailsStep from "./details/DetailsStep";
import PaymentTermsStep from "./module/PaymentTermsStep";
import ModuleSelectStep from "./moduleSelect/ModuleSelectStep";

interface Props {
  onClose?: () => void;
}

export function WriteNotaFlow({ onClose }: Props) {
  return (
    <NotaFormProvider>
      <VStack
        mt={{ base: 0, md: 5 }}
        bg="brand.100"
        py={2}
        px={3}
        borderRadius={{ base: 0, md: "30px" }}
        display={{ base: "flex", md: "none" }}
        maxW={{ base: "100%", md: "520px" }}
        w="100%"
        h="auto"
        alignSelf="flex-start"
        align="stretch"
      >
        <WriteStepperMobile onClose={onClose} />
      </VStack>
      <VStack
        w="650px"
        maxW="650px"
        bg="brand.100"
        py={2}
        px={3}
        borderRadius="30px"
        display={{ base: "none", md: "flex" }}
        align="stretch"
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
      ></DetailsStep>
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
