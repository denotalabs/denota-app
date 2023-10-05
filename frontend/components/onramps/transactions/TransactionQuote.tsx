import { Box, HStack, Image, useToast, VStack } from "@chakra-ui/react";
import { Form, Formik } from "formik";

import axios from "axios";
import { useNotaForm } from "../../../context/NotaFormProvider";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import AmountField from "../../fields/input/AmountField";
import TransactionTutorial from "./TransactionTutorial";

const TransactionQuote: React.FC<ScreenProps> = () => {
  const { updateNotaFormValues } = useNotaForm();
  const { next } = useStep();
  const toast = useToast();

  return (
    <Box gap={2} px={4} w="100%">
      <TransactionTutorial />
      <VStack bg="brand.100" w="100%" py={5} px={4} borderRadius="30px">
        <Formik
          initialValues={{
            amount: 10,
          }}
          onSubmit={async (values, actions) => {
            actions.setSubmitting(true);
            const riskScore = Math.floor(Math.random() * 50);
            try {
              const response = await axios.post(
                "https://denota.klymr.me/quote",
                { paymentAmount: values.amount, riskScore: riskScore },
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: localStorage.getItem("token"),
                  },
                }
              );
              if (response.data) {
                updateNotaFormValues({
                  amount: values.amount,
                  riskScore,
                  riskFee: response.data.quote,
                });
                next();
              } else {
                toast({
                  title: "Quote error. Try refreshing page",
                  status: "error",
                  duration: 3000,
                  isClosable: true,
                });
              }
            } catch (error) {
              toast({
                title: "Quote error. Try refreshing page",
                status: "error",
                duration: 3000,
                isClosable: true,
              });
            }
          }}
        >
          {(props) => {
            return (
              <Form>
                <HStack gap={5}>
                  <AmountField token={""} mode={""} />
                  <Image
                    boxSize="50px"
                    src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=023"
                    alt="USDC"
                  />
                </HStack>
                <RoundedButton type="submit" isLoading={props.isSubmitting}>
                  Get Quote
                </RoundedButton>
              </Form>
            );
          }}
        </Formik>
      </VStack>
    </Box>
  );
};

export default TransactionQuote;
