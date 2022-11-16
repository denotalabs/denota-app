import Stepper from "../stepper/Stepper";
import CheqConfirmStep from "./confirm/ConfirmStep";
import CheqDetailsStep from "./details/DetailsStep";
import CheqModuleStep from "./module/ModuleStep";

interface Props {
  onClose?: () => void;
}

function WriteCheqFlow({ onClose }: Props) {
  return (
    <Stepper onClose={onClose}>
      <CheqDetailsStep screenKey="write" isInvoice></CheqDetailsStep>
      <CheqModuleStep screenKey="module" isInvoice></CheqModuleStep>
      <CheqConfirmStep screenKey="confirm" isInvoice></CheqConfirmStep>
    </Stepper>
  );
}

export default WriteCheqFlow;
