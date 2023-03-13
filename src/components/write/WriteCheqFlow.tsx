import { HStack, useBreakpointValue, VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../context/NotaFormProvider";
import Stepper from "../designSystem/stepper/Stepper";
import { ConfirmSidePane } from "./confirm/ConfirmSidePane";
import ConfirmStep from "./confirm/ConfirmStep";
import DetailsStep from "./details/DetailsStep";
import MetadataStep from "./metadata/MetadataStep";
import PaymentTermsStep from "./module/PaymentTermsStep";
import ModuleSelectStep from "./moduleSelect/ModuleSelectStep";

interface Props {
  onClose?: () => void;
  isInvoice: boolean;
}

export function WriteCheqFlow({ onClose, isInvoice }: Props) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  // if (isMobile) {
  //   return (
  //     <VStack mt={5} bg="brand.100" py={2} px={4} borderRadius="30px">
  //       <WriteCheqStepper onClose={onClose} isInvoice={isInvoice} />
  //     </VStack>
  //   );
  // }

  return (
    <NotaFormProvider>
      <HStack
        justifyContent="center"
        alignItems="start"
        w="100%"
        px={10}
        h="100%"
        gap={10}
      >
        <VStack w="650px" bg="brand.100" py={2} px={4} borderRadius="30px">
          <WriteCheqStepper onClose={onClose} isInvoice={isInvoice} />
        </VStack>
        <ConfirmSidePane />
      </HStack>
    </NotaFormProvider>
  );
}

export function WriteCheqStepper({ onClose, isInvoice }: Props) {
  return (
    <Stepper onClose={onClose}>
      <DetailsStep
        screenKey="write"
        screenTitle={"Payment Details"}
        isInvoice={isInvoice}
      ></DetailsStep>
      <MetadataStep
        screenKey="metadata"
        screenTitle={"Payment Metadata (Optional)"}
      ></MetadataStep>
      <ModuleSelectStep
        screenKey="moduleSelect"
        screenTitle="Payment Module"
        isInvoice={isInvoice}
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

export default WriteCheqFlow;
