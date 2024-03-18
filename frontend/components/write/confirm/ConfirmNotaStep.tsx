import { Box } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useConfirmNota } from "../../../hooks/useConfirmNota";

import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps } from "../../designSystem/stepper/Stepper";
import ConfirmDetails from "./ConfirmDetails";
import ConfirmNotice from "./ConfirmNotice";

const ConfirmNotaStep: React.FC<ScreenProps> = () => {
  const { notaFormValues } = useNotaForm();
  const { needsApproval, approveAmount, writeNota } = useConfirmNota({
    onSuccess: () => {
      router.push("/", undefined, { shallow: true });
    },
  });

  const router = useRouter();

  const buttonText = useMemo(() => {
    if (needsApproval) {
      return "Approve " + notaFormValues.token;
    }
    return notaFormValues.mode === "invoice"
      ? "Create Invoice"
      : "Confirm Payment";
  }, [notaFormValues.mode, notaFormValues.token, needsApproval]);

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          module: notaFormValues.module ?? "directSend",
        }}
        onSubmit={async (values, actions) => {
          if (needsApproval) {
            await approveAmount();
            actions.setSubmitting(false);
          } else {
            await writeNota();
            actions.setSubmitting(false);
          }
        }}
      >
        {(props) => (
          <Form>
            <ConfirmNotice module={props.values.module}></ConfirmNotice>
            <ConfirmDetails></ConfirmDetails>
            <RoundedButton type="submit" isLoading={props.isSubmitting}>
              {buttonText}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default ConfirmNotaStep;
