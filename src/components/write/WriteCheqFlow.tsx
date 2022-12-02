import Stepper from "../designSystem/stepper/Stepper";
import CheqConfirmStep from "./confirm/ConfirmStep";
import CheqDetailsStep from "./details/DetailsStep";
import CheqModuleStep from "./module/ModuleStep";

interface Props {
  onClose?: () => void;
  isInvoice: boolean;
}

function WriteCheqFlow({ onClose, isInvoice }: Props) {
  return (
    <Stepper onClose={onClose}>
      <CheqDetailsStep
        screenKey="write"
        isInvoice={isInvoice}
      ></CheqDetailsStep>
      <CheqModuleStep screenKey="module" isInvoice={isInvoice}></CheqModuleStep>
      <CheqConfirmStep
        screenKey="confirm"
        isInvoice={isInvoice}
      ></CheqConfirmStep>
    </Stepper>
  );
}

export default WriteCheqFlow;
