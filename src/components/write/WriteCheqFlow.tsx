import Stepper from "../designSystem/stepper/Stepper";
import CheqConfirmStep from "./confirm/ConfirmStep";
import CheqDetailsStep from "./details/DetailsStep";
import CheqModuleStep from "./module/ModuleStep";
import CheqModuleSelectStep from "./moduleSelect/ModuleSelectStep";

interface Props {
  onClose?: () => void;
  isInvoice: boolean;
}

function WriteCheqFlow({ onClose, isInvoice }: Props) {
  return (
    <Stepper onClose={onClose} flowName={isInvoice ? "Request" : "Pay"}>
      <CheqDetailsStep
        screenKey="write"
        screenTitle={isInvoice ? "Invoice Details" : "Recipient Details"}
        isInvoice={isInvoice}
      ></CheqDetailsStep>
      <CheqModuleSelectStep
        screenKey="moduleSelect"
        screenTitle="Select Module"
        isInvoice={isInvoice}
      />
      <CheqModuleStep
        screenKey="module"
        screenTitle="Payment Terms"
        isInvoice={isInvoice}
      ></CheqModuleStep>
      <CheqConfirmStep
        screenKey="confirm"
        screenTitle="Confirm"
        isInvoice={isInvoice}
      ></CheqConfirmStep>
    </Stepper>
  );
}

export default WriteCheqFlow;
