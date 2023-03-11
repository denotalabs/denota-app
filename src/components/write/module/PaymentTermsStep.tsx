import { Box } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useMemo } from "react";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import ModuleTerms from "./ModuleTerms";

interface Props extends ScreenProps {
  isInvoice: boolean;
}

const PaymentTermsStep: React.FC<Props> = ({ isInvoice }) => {
  const { next, appendFormData, formData } = useStep();

  const currentDate = useMemo(() => {
    const d = new Date();
    const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

    return today.toISOString().slice(0, 10);
  }, []);

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          inspection: formData.inspection
            ? Number(formData.inspection)
            : 604800,
          module: formData.module ?? "direct",
          dueDate: formData.dueDate ?? currentDate,
        }}
        onSubmit={(values, actions) => {
          appendFormData({
            inspection: values.inspection.toString(),
            module: values.module,
            dueDate: values.dueDate,
          });
          next?.();
        }}
      >
        {(props) => (
          <Form>
            <ModuleTerms module={props.values.module} isInvoice={isInvoice} />
            <RoundedButton type="submit">{"Next"}</RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default PaymentTermsStep;
