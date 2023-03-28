import { Nota } from "../../../hooks/useNotas";
import SimpleModal from "../../designSystem/SimpleModal";
import ApproveAndPay from "./ApproveAndPay";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cheq: Nota;
}

function ApproveAndPayModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <ApproveAndPay cheq={props.cheq} onClose={props.onClose}></ApproveAndPay>
    </SimpleModal>
  );
}

export default ApproveAndPayModal;
