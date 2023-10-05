import { Box, Text, useToast } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useOnrampNota } from "../../../context/OnrampDataProvider";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps } from "../../designSystem/stepper/Stepper";
import { wait } from "../PaymentActions";

const TransactionPreview: React.FC<ScreenProps> = () => {
  const router = useRouter();
  const toast = useToast();
  const { addOnrampNota, onrampNotas } = useOnrampNota();
  const { notaFormValues } = useNotaForm();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Box w="100%" px={8} pb={4}>
      <DetailsRow
        title="Fiat Amount"
        value={String(notaFormValues.amount * 1.02) + " USD"}
      />
      <DetailsRow title="Fiat Payment Method" value="ACH" />
      <DetailsRow
        title="Crypto Amount"
        value={notaFormValues.amount + " USDC"}
      />
      <DetailsRow title="Risk Score" value={notaFormValues.riskScore} />
      <DetailsRow
        title="Risk Fee"
        value={notaFormValues.riskFee.toFixed(2) + " USDC"}
      />
      <Text py={4}>
        The risk score is calculated using data about the payment, account, and
        withdrawal address. The risk score can be calculated by Denota, the
        onramp, or a 3rd party.
      </Text>
      <Text py={4}>
        Only the risk score is represented on chain (not the input data). The
        payment risk fee is based on the risk score and market liquidity.
      </Text>
      <RoundedButton
        isLoading={isLoading}
        onClick={async () => {
          setIsLoading(true);
          await wait(2000);
          addOnrampNota({
            paymentId: String(onrampNotas.length + 1),
            date: new Date().toISOString().replace("T", " ").substring(0, 19),
            amount: notaFormValues.amount,
            riskFee: notaFormValues.riskFee,
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
          setIsLoading(false);
          router.push("/", undefined, { shallow: true });
        }}
        mt={2}
      >
        {"Add Coverage"}
      </RoundedButton>
    </Box>
  );
};
export default TransactionPreview;
