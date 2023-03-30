import { Center, HStack } from "@chakra-ui/react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { MUMBAI_ADDRESS } from "../../../context/chainInfo";
import { Cheq } from "../../../hooks/useCheqs";
import SimpleModal from "../../designSystem/SimpleModal";
import CheqDetails from "./CheqDetails";
import ShareToLensButton from "./ShareToLensButton";
import ViewOnOpenSeaButton from "./ViewOnOpenSeaButton";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cheq: Cheq;
}

function DetailsModal(props: Props) {
  const { blockchainState } = useBlockchainData();
  const { explorer, chainId, registrarAddress } = blockchainState;
  const { cheq } = props;
  return (
    <SimpleModal {...props}>
      <CheqDetails cheq={cheq} />
      {chainId === MUMBAI_ADDRESS && (
        <Center>
          <HStack spacing={4}>
            <ViewOnOpenSeaButton id={cheq.id} registrarAddress={registrarAddress} />
            <ShareToLensButton
              text={`I just created a nota payment NFT! View my nota here: ${explorer}${props.cheq.createdTransaction.hash}`}
              url="https://denota.xyz"
              via="denota"
            />
          </HStack>
        </Center>
      )}
    </SimpleModal>
  );
}

export default DetailsModal;
