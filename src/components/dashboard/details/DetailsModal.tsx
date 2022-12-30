import { Cheq } from "../../../hooks/useCheqs";
import SimpleModal from "../../designSystem/SimpleModal";
import CheqDetails from "./CheqDetails";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cheq: Cheq;
  maturityDate?: Date;
}

function DetailsModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <CheqDetails
        cheq={props.cheq}
        maturityDate={props.maturityDate}
      ></CheqDetails>
    </SimpleModal>
  );
}

export default DetailsModal;
