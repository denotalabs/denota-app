import { Box, Checkbox, Link, useToast } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useState } from "react";
import { useNotaForm } from "../../../context/NotaFormProvider";
import { useUploadNote } from "../../../hooks/useUploadNote";
import RoundedButton from "../../designSystem/RoundedButton";
import { ScreenProps, useStep } from "../../designSystem/stepper/Stepper";
import { notionOnboardingLink } from "../../nux/NewUserModal";
import MetadataBox from "./MetadataBox";

export type MetadataStepFormValues = {
  note: string;
  email: string;
  file: File | undefined;
  tags: string;
};

const MetadataStep: React.FC<ScreenProps> = () => {
  const { next } = useStep();
  const { appendFormData, formData, file, setFile } = useNotaForm();
  const { uploadFile } = useUploadNote();
  const [hasConsented, setHasConsented] = useState(true);
  const toast = useToast();

  return (
    <Box w="100%" p={4}>
      <Formik
        initialValues={{
          note: formData.note,
          email: formData.email ?? "",
          file: file,
          tags: formData.tags ?? "",
        }}
        onSubmit={async (values, actions) => {
          actions.setSubmitting(true);
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
              note: values.note,
              email: values.email,
              noteKey,
              tags: values.tags,
            });
            if (values.file) {
              setFile?.(values.file);
            }
            actions.setSubmitting(true);
            next?.();
          }
        }}
      >
        {(props) => {
          return (
            <Form>
              <MetadataBox />
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
                isDisabled={props.values.email != "" && !hasConsented}
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

export default MetadataStep;
