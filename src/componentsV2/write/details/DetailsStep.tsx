import { Box } from "@chakra-ui/react";
import CurrencySelector from "./CurrencySelector";
import DetailsBox from "./DetailsBox";
import RoundedButton from "../RoundedButton";
import { useStep } from "../../stepper/Stepper";
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
          token: "ETH",
          amount: 0,
          account: "",
        }}
        onSubmit={(values, actions) => {
          appendFormData({
            token: values.token,
            amount: values.amount.toString(),
            account: values.account,
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
