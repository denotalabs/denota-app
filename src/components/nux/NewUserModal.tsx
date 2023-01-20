import { Center, VStack, Text, Button } from "@chakra-ui/react";
import SimpleModal from "../designSystem/SimpleModal";
import Cookies from "js-cookie";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function NewUserModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <NewUserModalContent onClose={props.onClose} />
    </SimpleModal>
  );
}

interface ContentProps {
  onClose: () => void;
}

function NewUserModalContent({ onClose }: ContentProps) {
  const { blockchainState } = useBlockchainData();

  return (
    <VStack>
      <Center>
        <Text fontWeight={600} fontSize={"xl"}>
          Hey! Welcome to Cheq! Cheq is a revolutionary payment protocol that
          will onboard the 1B users onto web3
        </Text>
        <Button
          onClick={() => {
            Cookies.set(blockchainState.account, "1");
            onClose();
          }}
        >
          Got it!
        </Button>
      </Center>
    </VStack>
  );
}

export default NewUserModal;
