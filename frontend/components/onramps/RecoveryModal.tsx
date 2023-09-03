import { Text, VStack } from "@chakra-ui/react";
import RoundedButton from "../designSystem/RoundedButton";
import SimpleModal from "../designSystem/SimpleModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function RecoveryModal(props: Props) {
  return (
    <SimpleModal {...props}>
      <VStack gap={4} mt={10} mb={6}>
        <Text>
          Denota is built on smart contracts and DeFi so the recovery process is
          transparent and efficient.
        </Text>

        <RoundedButton>Start Recovery Process</RoundedButton>
      </VStack>
    </SimpleModal>
  );
}

export default RecoveryModal;
