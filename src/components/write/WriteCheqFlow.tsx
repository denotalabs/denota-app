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
        isInvoice={isInvoice}
      ></CheqDetailsStep>
      <CheqModuleSelectStep screenKey="moduleSelect" />
      <CheqModuleStep screenKey="module" isInvoice={isInvoice}></CheqModuleStep>
      <CheqConfirmStep
        screenKey="confirm"
        isInvoice={isInvoice}
      ></CheqConfirmStep>
    </Stepper>
  );
}

export default WriteCheqFlow;
