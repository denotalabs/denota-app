import { Box } from "@chakra-ui/react";
import CurrencySelector from "./CurrencySelector";
import DetailsBox from "./DetailsBox";
import RoundedButton from "../../designSystem/RoundedButton";
import { useStep } from "../../designSystem/stepper/Stepper";
import { Form, Formik } from "formik";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqDetailsStep({ isInvoice }: Props) {
  const { next, appendFormData } = useStep();
  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          token: "DAI",
          amount: 0,
          address: "",
          mode: isInvoice ? "invoice" : "pay",
        }}
        onSubmit={(values, actions) => {
          appendFormData({
            token: values.token,
            amount: values.amount.toString(),
            address: values.address,
            mode: values.mode,
          });
          next?.();
        }}
      >
        {(props) => (
          <Form>
            <CurrencySelector></CurrencySelector>
            <DetailsBox isInvoice={isInvoice}></DetailsBox>
            <RoundedButton type="submit">{"Next"}</RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqDetailsStep;
