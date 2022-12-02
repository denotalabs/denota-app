import { Box, Button, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useStep } from "../../designSystem/stepper/Stepper";
import RoundedButton from "../../designSystem/RoundedButton";
import ModuleInfo from "./ModuleInfo";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqModuleStep({ isInvoice }: Props) {
  const { next, appendFormData } = useStep();

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          inspection: 604800,
          module: "self",
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
