import Stepper from "../stepper/Stepper";
import CheqConfirmStep from "./CheqConfirmStep";
import CheqDetailsStep from "./CheqDetailsStep";
import CheqModuleStep from "./CheqModuleStep";

function WriteCheqFlow() {
  return (
    <Stepper>
      <CheqDetailsStep screenKey="write" isInvoice></CheqDetailsStep>
      <CheqModuleStep screenKey="module" isInvoice></CheqModuleStep>
      <CheqConfirmStep screenKey="confirm" isInvoice></CheqConfirmStep>
    </Stepper>
  );
}

export default WriteCheqFlow;
