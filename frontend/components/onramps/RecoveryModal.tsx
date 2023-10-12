import { Text, useToast, VStack } from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { useNotas } from "../../context/NotaDataProvider";
import RoundedButton from "../designSystem/RoundedButton";
import SimpleModal from "../designSystem/SimpleModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onchainId: string;
}

function RecoveryModal(props: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const { refresh } = useNotas();
  const toast = useToast();

  return (
    <SimpleModal {...props}>
      <VStack gap={4} mt={10} mb={6}>
        <Text>{`Payment #${props.onchainId}`}</Text>
        <Text>
          Denota is built on smart contracts and DeFi so the recovery process is
          transparent and efficient.
        </Text>

        <RoundedButton
          onClick={async () => {
            setIsLoading(true);

            try {
              const response = await axios.post(
                "https://denota.klymr.me/recovery",
                {
                  notaId: props.onchainId,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: localStorage.getItem("token"),
                  },
                }
              );
              if (response.data) {
                refresh();
                toast({
                  title: "Recovery started",
                  status: "success",
                  duration: 3000,
                  isClosable: true,
                });
                props.onClose();
              } else {
                toast({
                  title: "Recovery error",
                  status: "error",
                  duration: 3000,
                  isClosable: true,
                });
              }
            } catch (error) {
              toast({
                title: "Recovery error",
                status: "error",
                duration: 3000,
                isClosable: true,
              });
              console.log(error);
            } finally {
              setIsLoading(false);
            }
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
