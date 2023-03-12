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

interface Props extends ScreenProps {
  isInvoice: boolean;
}

const CheqConfirmStep: React.FC<Props> = ({ isInvoice }: Props) => {
  const { formData } = useNotaForm();
  const { needsApproval, approveAmount, writeNota } = useConfirmNota({
    onSuccess: () => {
      router.push("/", undefined, { shallow: true });
    },
  });

  const router = useRouter();

  const buttonText = useMemo(() => {
    if (needsApproval) {
      return "Approve " + formData.token;
    }
    return formData.mode === "invoice" ? "Create Invoice" : "Confirm Payment";
  }, [formData.mode, formData.token, needsApproval]);

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          module: formData.module ?? "direct",
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
            <ConfirmNotice
              isInvoice={formData.mode === "invoice"}
              module={props.values.module}
            ></ConfirmNotice>
            <ConfirmDetails isInvoice={isInvoice}></ConfirmDetails>
            <RoundedButton type="submit" isLoading={props.isSubmitting}>
              {buttonText}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default CheqConfirmStep;
