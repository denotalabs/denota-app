import { Box, HStack, Image, Text, useToast, VStack } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useOnrampNota } from "../../context/OnrampDataProvider";

import { useRouter } from "next/router";
import RoundedButton from "../designSystem/RoundedButton";
import AmountField from "../fields/input/AmountField";
import { wait } from "./PaymentActions";

function NewTransaction() {
  const { addOnrampNota, onrampNotas } = useOnrampNota();
  const router = useRouter();
  const toast = useToast();

  return (
    <VStack w="300px" bg="brand.100" py={5} px={4} borderRadius="30px">
      <Box w="100%" p={4}>
        <Text pb={4}>
          A simple call to Denota's Transaction API adds coverage to a user
          crypto purchases/withdrawals.
        </Text>
        <Text py={4}>
          Once the transaction is covered, your onramp will be able to recover
          funds in the case of a chargeback.
        </Text>
        <Text py={4}>
          Simulate a user withdrawal below to see Denota's coverage in action.
        </Text>
      </Box>
      <Formik
        initialValues={{
          amount: 10,
        }}
        onSubmit={async (values, actions) => {
          actions.setSubmitting(true);
          await wait(3000);
          addOnrampNota({
            paymentId: String(onrampNotas.length + 1),
            date: new Date().toISOString().replace("T", " ").substring(0, 19),
            amount: values.amount,
            factor: 0.91444,
            userId: "111122",
            paymentStatus: "Withdrawn",
            riskScore: Math.floor(Math.random() * 100),
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
  );
}

export default NewTransaction;
