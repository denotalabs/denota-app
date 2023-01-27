import { Box } from "@chakra-ui/react";
import DetailsBox from "./DetailsBox";
import RoundedButton from "../../designSystem/RoundedButton";
import { useStep } from "../../designSystem/stepper/Stepper";
import { Form, Formik } from "formik";
import CurrencySelectorV2 from "./CurrencySelector";
import { useUploadNote } from "../../../hooks/useUploadNote";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqDetailsStep({ isInvoice }: Props) {
  const { next, appendFormData, formData } = useStep();
  const { uploadNote } = useUploadNote();

  let initialMode = formData.mode;

  if (initialMode === undefined) {
    initialMode = isInvoice ? "invoice" : "pay";
  }

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          token: formData.token ?? "DAI",
          amount: formData.amount ? Number(formData.amount) : 0,
          address: formData.address ?? "",
          note: formData.note,
          mode: initialMode,
        }}
        onSubmit={async (values, actions) => {
          const noteKey = "";
          // TODO: re-enable once contract integration is ready
          // if (formData.note === values.note && formData.note) {
          //   noteKey = formData.noteKey;
          // } else {
          //   noteKey = (await uploadNote(values.note)) ?? "";
          // }
          appendFormData({
            token: values.token,
            amount: values.amount.toString(),
            address: values.address,
            mode: values.mode,
            note: values.note,
            noteKey,
          });
          next?.();
        }}
      >
        {(props) => (
          <Form>
            <CurrencySelectorV2></CurrencySelectorV2>
            <DetailsBox isInvoice={isInvoice}></DetailsBox>
            <RoundedButton type="submit" isLoading={props.isSubmitting}>
              {props.isSubmitting ? "Uploading note" : "Next"}
            </RoundedButton>
          </Form>
        )}
      </Formik>
    </Box>
  );
}

export default CheqDetailsStep;
