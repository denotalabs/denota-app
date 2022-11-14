import { Button, Flex, FormLabel } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import AccountField from "../../components/input/AccountField";
import AmountField from "../../components/input/AmountField";
import TokenField from "../../components/input/TokenField";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

// screenKey used in stepper flow
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function CheqDetailsStep({ isInvoice }: Props) {
  return (
    <Formik
      initialValues={{
        token: "dai",
        amount: 0,
        payer: "",
        duration: 60,
      }}
      onSubmit={(values, actions) => {
        console.log("submitted");
      }}
    >
      {(props) => (
        <Form>
          <FormLabel>
            {isInvoice ? "Payer Address" : "Recipient Address"}
          </FormLabel>
          <Flex gap={10}>
            <AccountField fieldName="payer" placeholder="0x" />
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

export default CheqDetailsStep;
