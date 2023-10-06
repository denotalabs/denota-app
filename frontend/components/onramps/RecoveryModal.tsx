import { Text, VStack } from "@chakra-ui/react";
import { useState } from "react";
import { useNotas } from "../../context/NotaDataProvider";
import RoundedButton from "../designSystem/RoundedButton";
import SimpleModal from "../designSystem/SimpleModal";
import { wait } from "./PaymentActions";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
}

function RecoveryModal(props: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { updateNota } = useNotas();

  return (
    <SimpleModal {...props}>
      <VStack gap={4} mt={10} mb={6}>
        <Text>{`Payment #${props.paymentId}`}</Text>
        <Text>
          Denota is built on smart contracts and DeFi so the recovery process is
          transparent and efficient.
        </Text>

        <RoundedButton
          onClick={async () => {
            setIsLoading(true);
            await wait(3000);
            updateNota(props.paymentId, {
              paymentStatus: "Recovery Started",
            });
            props.onClose();
            setIsLoading(false);
          }}
          isLoading={isLoading}
        >
          Start Recovery Process
        </RoundedButton>
      </VStack>
    </SimpleModal>
  );
}

export default RecoveryModal;
