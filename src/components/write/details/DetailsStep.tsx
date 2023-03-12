import { Box, Checkbox, Link, useToast } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useUploadNote } from "../../../hooks/useUploadNote";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import { notionOnboardingLink } from "../../nux/NewUserModal";
import CurrencySelectorV2 from "./CurrencySelector";
import DetailsBox from "./DetailsBox";

interface Props extends ScreenProps {
  isInvoice: boolean;
}

const CheqDetailsStep: React.FC<Props> = ({ isInvoice }) => {
  const { next } = useStep();
  const { appendFormData, formData, file, setFile } = useNotaForm();
  const { uploadFile } = useUploadNote();
  const [hasConsented, setHasConsented] = useState(true);
  const toast = useToast();

  let initialMode = formData.mode;

  if (initialMode === undefined) {
    initialMode = isInvoice ? "invoice" : "pay";
  }

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          token: formData.token ?? "DAI",
          amount: formData.amount ? Number(formData.amount) : undefined,
          address: formData.address ?? "",
          note: formData.note,
          mode: initialMode,
          email: formData.email ?? "",
          file: file,
          tags: formData.tags ?? "",
        }}
        onSubmit={async (values, actions) => {
          let noteKey = "";
          if (values.note || values.file || values.tags) {
            if (
              formData.note === values.note &&
              values.file?.name === file?.name &&
              formData.tags === values.tags
            ) {
              noteKey = formData.noteKey;
            } else {
              noteKey =
                (await uploadFile(values.file, values.note, values.tags)) ?? "";
            }
          }
          if (noteKey === undefined) {
            toast({
              title: "Error uploading file",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          } else {
            appendFormData({
              token: values.token,
              amount: values.amount ? values.amount.toString() : "0",
              address: values.address,
              mode: values.mode,
              note: values.note,
              email: values.email,
              noteKey,
              tags: values.tags,
            });
            if (values.file) {
              setFile?.(values.file);
            }
            next?.();
          }
        }}
      >
        {(props) => {
          const isValid =
            !props.errors.address &&
            !props.errors.amount &&
            props.values.address &&
            props.values.amount;
          return (
            <Form>
              <CurrencySelectorV2></CurrencySelectorV2>
              <DetailsBox
                isInvoice={isInvoice}
                token={props.values.token}
                mode={props.values.mode}
              ></DetailsBox>
              {props.values.email && (
                <Checkbox
                  defaultChecked
                  py={2}
                  onChange={(e) => setHasConsented(e.target.checked)}
                >
                  I agree to Cheq's{" "}
                  <Link
                    isExternal
                    textDecoration={"underline"}
                    href={notionOnboardingLink}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    isExternal
                    textDecoration={"underline"}
                    href={notionOnboardingLink}
                  >
                    Privacy Policy
                  </Link>
                </Checkbox>
              )}
              <RoundedButton
                mt={2}
                type="submit"
                isLoading={props.isSubmitting}
                isDisabled={
                  (props.values.email != "" &&
                    !hasConsented &&
                    !props.errors) ||
                  !isValid
                }
              >
                {props.isSubmitting ? "Uploading note" : "Next"}
              </RoundedButton>
            </Form>
          );
        }}
      </Formik>
    </Box>
  );
};

export default CheqDetailsStep;
