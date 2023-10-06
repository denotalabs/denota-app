import { Box, Text, useToast } from "@chakra-ui/react";
import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { useNotas } from "../../../context/NotaDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import DetailsRow from "../../designSystem/DetailsRow";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps } from "../../designSystem/stepper/Stepper";

const TransactionPreview: React.FC<ScreenProps> = () => {
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useNotas();
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
          try {
            const response = await axios.post(
              "https://denota.klymr.me/nota",
              {
                paymentAmount: notaFormValues.amount,
                riskScore: notaFormValues.riskScore,
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
                title: "Transaction succeeded",
                description: "Coverage added",
                status: "success",
                duration: 3000,
                isClosable: true,
              });
              setIsLoading(false);
              router.push("/", undefined, { shallow: true });
            } else {
              toast({
                title: "Error creating coverage",
                status: "error",
                duration: 3000,
                isClosable: true,
              });
            }
          } catch (error) {
            toast({
              title: "Error creating coverage",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
        }}
        mt={2}
      >
        {"Add Coverage"}
      </RoundedButton>
    </Box>
  );
};
export default TransactionPreview;
