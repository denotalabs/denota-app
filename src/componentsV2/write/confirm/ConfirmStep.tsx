import { Box, Button, Text } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useStep } from "../../stepper/Stepper";
import RoundedButton from "../RoundedButton";
import ConfirmDetails from "./ConfirmDetails";
import ConfirmNotice from "./ConfirmNotice";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqConfirmStep({ isInvoice }: Props) {
  const { onClose, formData } = useStep();

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{}}
        onSubmit={() => {
          console.log({ formData });

          onClose?.();
        }}
      >
        {() => (
          <Form>
            <ConfirmNotice isInvoice={isInvoice}></ConfirmNotice>
            <ConfirmDetails></ConfirmDetails>
            <RoundedButton type="submit">
              {isInvoice ? "Create Invoice" : "Confirm Payment"}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqConfirmStep;
