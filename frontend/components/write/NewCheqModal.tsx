import { Modal, ModalBody, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { WriteCheqStepper } from "./WriteCheqFlow";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isInvoice: boolean;
}

function NewCheqModal({ isOpen, onClose, isInvoice }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size={["full", "2xl", "2xl"]}>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="brand.100" mt="5">
        <ModalBody>
          <WriteCheqStepper onClose={onClose} isInvoice={isInvoice} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default NewCheqModal;
