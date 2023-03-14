import { Box } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useNotaForm } from "../../../context/NotaFormProvider";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import CurrencySelectorV2 from "./CurrencySelector";
import DetailsBox from "./DetailsBox";

interface Props extends ScreenProps {
  isInvoice: boolean;
}

export type DetailsStepFormValues = {
  token: string;
  amount: string | undefined;
  address: string;
  mode: string;
};

const CheqDetailsStep: React.FC<Props> = ({ isInvoice }) => {
  const { next } = useStep();
  const { formData } = useNotaForm();

  let initialMode = formData.mode;

  if (initialMode === undefined) {
    initialMode = isInvoice ? "invoice" : "pay";
  }

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          token: formData.token ?? "NATIVE",
          amount: formData.amount ?? undefined,
          address: formData.address ?? "",
          mode: initialMode,
        }}
        onSubmit={async (values, actions) => {
          next?.();
        }}
      >
        {(props) => {
          const isValid =
            !props.errors.address &&
            !props.errors.amount &&
            props.values.address &&
            props.values.amount;
          return (
            <Form>
              <CurrencySelectorV2></CurrencySelectorV2>
              <DetailsBox
                isInvoice={isInvoice}
                token={props.values.token}
                mode={props.values.mode}
              ></DetailsBox>

              <RoundedButton
                mt={2}
                type="submit"
                isLoading={props.isSubmitting}
                isDisabled={!isValid}
              >
                {"Next"}
              </RoundedButton>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};

export default CheqDetailsStep;
