import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import CheqDetails from "./CheqDetails";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function DetailsModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent maxW="650px" bg="gray.900">
        <ModalCloseButton />
        <ModalBody>
          <CheqDetails></CheqDetails>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default DetailsModal;
