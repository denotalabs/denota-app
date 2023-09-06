import { VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../../context/NotaFormProvider";
import Stepper from "../../designSystem/stepper/Stepper";
import TransactionInput from "./TransactionInput";
import TransactionPreview from "./TransactionPreview";

export function TransactionCoverageFlow() {
  return (
    <NotaFormProvider>
      <VStack
        w="300px"
        bg="brand.100"
        py={2}
        px={4}
        borderRadius="30px"
        gap={0}
      >
        <Stepper>
          <TransactionInput
            screenKey="input"
            screenTitle="Simulate Transaction"
          />
          <TransactionPreview
            screenKey="preview"
            screenTitle="Simulate Transaction"
          />
        </Stepper>
      </VStack>
    </NotaFormProvider>
  );
}
