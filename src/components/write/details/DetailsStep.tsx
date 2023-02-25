import { Box, Checkbox, Link } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useState } from "react";
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
  const { next, appendFormData, formData } = useStep();
  const { uploadFile } = useUploadNote();
  const [hasConsented, setHasConsented] = useState(true);

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
          email: formData.email ?? "",
          file: undefined,
        }}
        onSubmit={async (values, actions) => {
          let noteKey = "";
          if (formData.note === values.note && formData.note && !values.file) {
            noteKey = formData.noteKey;
          } else if (values.note || values.file) {
            noteKey = (await uploadFile(values.file, values.note)) ?? "";
          }
          appendFormData({
            token: values.token,
            amount: values.amount.toString(),
            address: values.address,
            mode: values.mode,
            note: values.note,
            email: values.email,
            noteKey,
          });
          next?.();
        }}
      >
        {(props) => (
          <Form>
            <CurrencySelectorV2></CurrencySelectorV2>
            <DetailsBox isInvoice={isInvoice}></DetailsBox>
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
        )}
      </Formik>
    </Box>
  );
};

export default CheqDetailsStep;
