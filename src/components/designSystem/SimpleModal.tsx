import { ReactNode } from "react";

import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
} from "@chakra-ui/react";

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
      <ModalContent bg="brand.700">
        {!hideClose && <ModalCloseButton />}
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default SimpleModal;
