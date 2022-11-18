import { Box, Button, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useStep } from "../../stepper/Stepper";
import RoundedButton from "../RoundedButton";
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
          inspection: "90",
          module: "self",
        }}
        onSubmit={(values, actions) => {
          console.log({ values });
          appendFormData({
            inspection: values.inspection,
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
