import { Button, Flex, FormLabel } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import AccountField from "../../components/input/AccountField";
import AmountField from "../../components/input/AmountField";
import TokenField from "../../components/input/TokenField";

function WriteCheqStep() {
  return (
    <Formik
      initialValues={{
        token: "dai",
        amount: 0,
        bearer: "",
        duration: 60,
      }}
      onSubmit={(values, actions) => {
        console.log("submitted");
      }}
    >
      {(props) => (
        <Form>
          <FormLabel>Payer Address</FormLabel>
          <Flex gap={10}>
            <AccountField fieldName="bearer" placeholder="0x" />
          </Flex>
          <FormLabel>Select Currency</FormLabel>
          <Flex gap={10}>
            <TokenField />
          </Flex>
          <FormLabel>Amount</FormLabel>
          <Flex gap={10}>
            <AmountField />
          </Flex>
          <Flex gap={10}>
            <Button mt={4} isLoading={props.isSubmitting} type="submit">
              Next
            </Button>
          </Flex>
        </Form>
      )}
    </Formik>
  );
}

export default WriteCheqStep;
