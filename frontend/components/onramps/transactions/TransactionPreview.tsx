import { Box, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useOnrampNota } from "../../../context/OnrampDataProvider";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps } from "../../designSystem/stepper/Stepper";

const TransactionPreview: React.FC<ScreenProps> = () => {
  const router = useRouter();
  const toast = useToast();
  const { addOnrampNota, onrampNotas } = useOnrampNota();
  const { notaFormValues } = useNotaForm();

  return (
    <Box w="100%" p={4}>
      <RoundedButton
        onClick={() => {
          addOnrampNota({
            paymentId: String(onrampNotas.length + 1),
            date: new Date().toISOString().replace("T", " ").substring(0, 19),
            amount: notaFormValues.amount,
            riskFee: notaFormValues.amount * (notaFormValues.riskScore / 10000),
            userId: "111122",
            paymentStatus: "Withdrawn",
            riskScore: notaFormValues.riskScore,
          });
          toast({
            title: "Transaction succeeded",
            description: "Coverage added",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
          router.push("/", undefined, { shallow: true });
        }}
        mt={2}
      >
        {"Confirm"}
      </RoundedButton>
    </Box>
  );
};
export default TransactionPreview;
