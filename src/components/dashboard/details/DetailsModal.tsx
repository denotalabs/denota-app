import { Center } from "@chakra-ui/react";
import { Cheq } from "../../../hooks/useCheqs";
import SimpleModal from "../../designSystem/SimpleModal";
import CheqDetails from "./CheqDetails";
import ShareToLensButton from "./ShareToLensButton";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cheq: Cheq;
}

function DetailsModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <CheqDetails cheq={props.cheq} />
      <Center>
        <ShareToLensButton text="hello world" url="https://mycoolapp.xyz" />
      </Center>
    </SimpleModal>
  );
}

export default DetailsModal;
