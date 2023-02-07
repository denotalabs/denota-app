import { Box } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import RoundedButton from "../../designSystem/RoundedButton";
import { useStep } from "../../designSystem/stepper/Stepper";
import ModuleInfo from "./ModuleInfo";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqModuleStep({ isInvoice }: Props) {
  const { next, appendFormData, formData } = useStep();

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          inspection: formData.inspection
            ? Number(formData.inspection)
            : 604800,
          module: formData.module ?? "direct",
        }}
        onSubmit={(values, actions) => {
          appendFormData({
            inspection: values.inspection.toString(),
            module: values.module,
          });
          next?.();
        }}
      >
        {(props) => (
          <Form>
            <ModuleInfo />
            <RoundedButton type="submit">{"Next"}</RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqModuleStep;
