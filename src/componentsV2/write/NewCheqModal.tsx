import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import WriteCheqFlow from "./WriteCheqFlow";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function NewCheqModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody>
          <WriteCheqFlow onClose={onClose} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default NewCheqModal;
