import { Box, HStack, Image, VStack } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useOnrampNota } from "../../../context/OnrampDataProvider";

import { useNotaForm } from "../../../context/NotaFormProvider";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import AmountField from "../../fields/input/AmountField";
import { wait } from "../PaymentActions";
import TransactionTutorial from "./TransactionTutorial";

const TransactionInput: React.FC<ScreenProps> = () => {
  const { addOnrampNota, onrampNotas } = useOnrampNota();

  const { updateNotaFormValues } = useNotaForm();
  const { next } = useStep();

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
            await wait(2000);
            const riskScore = Math.floor(Math.random() * 50);
            updateNotaFormValues({ amount: values.amount, riskScore });
            next();
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

export default TransactionInput;
