import { Box } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useMemo } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaForm } from "../../../context/NotaFormProvider";
import {
  createValidatePaymentTerms,
  getAuditorFieldsForPaymentTerms,
  getPaymentTermsInitialValues,
  PaymentTermsFormValues,
  paymentTermsValuesToNotaForm,
} from "../../../utils/paymentTermsForm";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import ModuleTerms from "./ModuleTerms";

export type { PaymentTermsFormValues };

const PaymentTermsStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();
  const { updateNotaFormValues, notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();
  const connectedAccount = blockchainState.account ?? "";

  const auditorFields = useMemo(
    () => getAuditorFieldsForPaymentTerms(notaFormValues, connectedAccount),
    [connectedAccount, notaFormValues]
  );

  const initialValues = useMemo(
    () =>
      getPaymentTermsInitialValues(notaFormValues, auditorFields, {
        includeAxelar: true,
      }),
    [notaFormValues, auditorFields]
  );

  const validate = useMemo(
    () => createValidatePaymentTerms(notaFormValues.module ?? ""),
    [notaFormValues.module]
  );

  return (
    <Box w="100%" p={4}>
      <Formik
        enableReinitialize
        initialValues={initialValues}
        validate={validate}
        onSubmit={(values) => {
          updateNotaFormValues(paymentTermsValuesToNotaForm(values, { includeAxelar: true }));
          next?.();
        }}
      >
        {(props) => (
          <Form>
            <ModuleTerms module={notaFormValues.module ?? props.values.module} />
            <RoundedButton
              type="submit"
              isDisabled={Object.keys(props.errors).length > 0}
            >
              {"Review and Confirm"}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default PaymentTermsStep;
