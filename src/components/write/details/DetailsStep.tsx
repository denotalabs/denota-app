import { Box } from "@chakra-ui/react";
import DetailsBox from "./DetailsBox";
import RoundedButton from "../../designSystem/RoundedButton";
import { useStep } from "../../designSystem/stepper/Stepper";
import { Form, Formik } from "formik";
import CurrencySelectorV2 from "./CurrencySelector";

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
          console.log({ token: values.token });
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
            {/* <CurrencySelector></CurrencySelector> */}
            <CurrencySelectorV2></CurrencySelectorV2>
            <DetailsBox isInvoice={isInvoice}></DetailsBox>
            <RoundedButton type="submit">{"Next"}</RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqDetailsStep;
