import { VStack } from "@chakra-ui/react";
import { NotaFormProvider } from "../../../context/NotaFormProvider";
import Stepper from "../../designSystem/stepper/Stepper";
import TransactionPreview from "./TransactionPreview";
import TransactionQuote from "./TransactionQuote";

export function TransactionCoverageFlow() {
  return (
    <NotaFormProvider>
      <VStack
        w="400px"
        bg="brand.100"
        py={4}
        px={4}
        borderRadius="30px"
        gap={0}
      >
        <Stepper>
          <TransactionQuote
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
