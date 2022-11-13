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
import WriteCheqStep from "./WriteCheqStep";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function NewCheqModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent>
        <ModalHeader>New Invoice</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <WriteCheqStep />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default NewCheqModal;
