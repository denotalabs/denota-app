import { NotaFormProvider } from "../../../context/NotaFormProvider";
import Stepper from "../../designSystem/stepper/Stepper";
import TransactionInput from "./TransactionInput";
import TransactionPreview from "./TransactionPreview";

export function TransactionCoverageFlow() {
  return (
    <NotaFormProvider>
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
    </NotaFormProvider>
  );
}
