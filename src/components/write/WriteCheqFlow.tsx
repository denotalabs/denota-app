import { HStack, VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../context/NotaFormProvider";
import Stepper from "../designSystem/stepper/Stepper";
import { ConfirmSidePane } from "./confirm/ConfirmSidePane";
import ConfirmStep from "./confirm/ConfirmStep";
import DetailsStep from "./details/DetailsStep";
import PaymentTermsStep from "./module/PaymentTermsStep";
import ModuleSelectStep from "./moduleSelect/ModuleSelectStep";

interface Props {
  onClose?: () => void;
  isInvoice: boolean;
}

function WriteCheqFlow({ onClose, isInvoice }: Props) {
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
          <Stepper onClose={onClose}>
            <DetailsStep
              screenKey="write"
              screenTitle={"Payment Details"}
              isInvoice={isInvoice}
            ></DetailsStep>
            <ModuleSelectStep
              screenKey="moduleSelect"
              screenTitle="Select Module"
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
        </VStack>
        <ConfirmSidePane />
      </HStack>
    </NotaFormProvider>
  );
}

export default WriteCheqFlow;
