import { Cheq } from "../../../hooks/useCheqs";
import SimpleModal from "../../designSystem/SimpleModal";
import CheqDetails from "./CheqDetails";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cheq: Cheq;
  maturityDate?: Date;
  isVoided?: boolean;
}

function DetailsModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <CheqDetails
        cheq={props.cheq}
        maturityDate={props.maturityDate}
        isVoided={props.isVoided}
      ></CheqDetails>
    </SimpleModal>
  );
}

export default DetailsModal;
