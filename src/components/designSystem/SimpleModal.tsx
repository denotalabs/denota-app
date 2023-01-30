import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";
import { ReactNode } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  hideClose?: boolean;
  closeOnOverlayClick?: boolean;
}

function SimpleModal({
  isOpen,
  onClose,
  children,
  hideClose,
  closeOnOverlayClick = true,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick={closeOnOverlayClick}
    >
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent bg="gray.900">
        {!hideClose && <ModalCloseButton />}
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default SimpleModal;
