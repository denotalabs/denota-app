import { Box } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import ModuleTerms from "./ModuleTerms";

export type PaymentTermsFormValues = {
  inspection: number;
  module: string;
  dueDate: string;
  milestones: string[];
};

const PaymentTermsStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();
  const { updateNotaFormValues, notaFormValues } = useNotaForm();

  const currentDate = useMemo(() => {
    const d = new Date();
    const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000);

    return today.toISOString().slice(0, 10);
  }, []);

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          inspection: notaFormValues.inspection
            ? Number(notaFormValues.inspection)
            : 604800,
          module: notaFormValues.module ?? "directSend",
          dueDate: notaFormValues.dueDate ?? currentDate,
          auditor: notaFormValues.auditor ?? "",
          milestones: notaFormValues.milestones
            ? notaFormValues.milestones.split(",")
            : [notaFormValues.amount],
          axelarEnabled: notaFormValues.axelarEnabled ?? false,
        }}
        onSubmit={(values) => {
          updateNotaFormValues({
            milestones: values.milestones.join(","),
            dueDate: values.dueDate,
            auditor: values.auditor,
            axelarEnabled: values.axelarEnabled ? "true" : undefined,
          });
          next?.();
        }}
      >
        {(props) => (
          <Form>
            <ModuleTerms module={props.values.module} />
            <RoundedButton type="submit">{"Next"}</RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default PaymentTermsStep;
