import { Center } from "@chakra-ui/react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { MUMBAI_ADDRESS } from "../../../context/chainInfo";
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
  const { blockchainState } = useBlockchainData();
  const { explorer, chainId } = blockchainState;
  return (
    <SimpleModal {...props}>
      <CheqDetails cheq={props.cheq} />
      {chainId === MUMBAI_ADDRESS && (
        <Center>
          <ShareToLensButton
            text={`I just created a nota payment NFT! View my nota here: ${explorer}${props.cheq.createdTransaction.hash}`}
            url="https://denota.xyz"
            via="denota"
          />
        </Center>
      )}
    </SimpleModal>
  );
}

export default DetailsModal;
