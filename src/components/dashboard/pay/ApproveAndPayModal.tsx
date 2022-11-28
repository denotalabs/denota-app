import SimpleModal from "../../designSystem/SimpleModal";
import ApproveAndPay from "./ApproveAndPay";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function ApproveAndPayModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <ApproveAndPay></ApproveAndPay>
    </SimpleModal>
  );
}

export default ApproveAndPayModal;
