import { HStack, Image, VStack } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useOnrampNota } from "../../../context/OnrampDataProvider";

import { useNotaForm } from "../../../context/NotaFormProvider";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps } from "../../designSystem/stepper/Stepper";
import AmountField from "../../fields/input/AmountField";
import { wait } from "../PaymentActions";
import TransactionTutorial from "./TransactionTutorial";

const TransactionInput: React.FC<ScreenProps> = () => {
  const { addOnrampNota, onrampNotas } = useOnrampNota();

  const { updateNotaFormValues } = useNotaForm();

  return (
    <VStack gap={5}>
      <TransactionTutorial />
      <VStack w="300px" bg="brand.100" py={5} px={4} borderRadius="30px">
        <Formik
          initialValues={{
            amount: 10,
          }}
          onSubmit={async (values, actions) => {
            actions.setSubmitting(true);
            await wait(3000);
            const riskScore = Math.floor(Math.random() * 100);
            updateNotaFormValues({ amount: values.amount, riskScore });

            addOnrampNota({
              paymentId: String(onrampNotas.length + 1),
              date: new Date().toISOString().replace("T", " ").substring(0, 19),
              amount: values.amount,
              riskFee: values.amount * (riskScore / 10000),
              userId: "111122",
              paymentStatus: "Withdrawn",
              riskScore,
            });
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
                  Confirm
                </RoundedButton>
              </Form>
            );
          }}
        </Formik>
      </VStack>
    </VStack>
  );
};

export default TransactionInput;
