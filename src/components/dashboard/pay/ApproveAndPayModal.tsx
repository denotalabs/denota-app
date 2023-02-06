import ApproveAndPay from "./ApproveAndPay";

import { Cheq } from "../../../hooks/useCheqs";
import SimpleModal from "../../designSystem/SimpleModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cheq: Cheq;
}

function ApproveAndPayModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <ApproveAndPay cheq={props.cheq} onClose={props.onClose}></ApproveAndPay>
    </SimpleModal>
  );
}

export default ApproveAndPayModal;
