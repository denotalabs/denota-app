import SimpleModal from "../../designSystem/SimpleModal";
import CheqDetails from "./CheqDetails";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function DetailsModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <CheqDetails></CheqDetails>
    </SimpleModal>
  );
}

export default DetailsModal;
