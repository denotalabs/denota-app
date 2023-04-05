import { Nota } from "../../../hooks/useNotas";
import SimpleModal from "../../designSystem/SimpleModal";
import ApproveAndPay from "./ApproveAndPay";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nota: Nota;
}

function ApproveAndPayModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <ApproveAndPay nota={props.nota} onClose={props.onClose}></ApproveAndPay>
    </SimpleModal>
  );
}

export default ApproveAndPayModal;
