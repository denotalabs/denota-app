import Stepper from "../designSystem/stepper/Stepper";
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
    <Stepper onClose={onClose}>
      <DetailsStep
        screenKey="write"
        screenTitle={isInvoice ? "Invoice Details" : "Recipient Details"}
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
  );
}

export default WriteCheqFlow;
