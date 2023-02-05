import { Modal, ModalBody, ModalContent, ModalOverlay } from "@chakra-ui/react";
import WriteCheqFlow from "./WriteCheqFlow";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isInvoice: boolean;
}

function NewCheqModal({ isOpen, onClose, isInvoice }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="brand.700">
        <ModalBody>
          <WriteCheqFlow onClose={onClose} isInvoice={isInvoice} />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default NewCheqModal;
