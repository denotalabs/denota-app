import { Center, HStack } from "@chakra-ui/react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { MUMBAI_ADDRESS } from "../../../context/chainInfo";
import { Nota } from "../../../hooks/useNotas";
import SimpleModal from "../../designSystem/SimpleModal";
import NotaDetails from "./NotaDetails";
import ShareToLensButton from "./ShareToLensButton";
import ViewOnOpenSeaButton from "./ViewOnOpenSeaButton";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nota: Nota;
}

function DetailsModal(props: Props) {
  const { blockchainState } = useBlockchainData();
  const { explorer, chainId, registrarAddress } = blockchainState;
  const { nota } = props;
  return (
    <SimpleModal {...props}>
      <NotaDetails nota={props.nota} />
      {chainId === MUMBAI_ADDRESS && (
        <Center>
          <HStack spacing={4}>
            <ViewOnOpenSeaButton
              id={nota.id}
              registrarAddress={registrarAddress}
            />
            <ShareToLensButton
              text={`I just created a nota payment NFT! View my nota here: ${explorer}${props.nota.createdTransaction.hash}`}
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
