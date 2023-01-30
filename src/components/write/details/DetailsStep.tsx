import { Box, Checkbox, Link } from "@chakra-ui/react";
import DetailsBox from "./DetailsBox";
import RoundedButton from "../../designSystem/RoundedButton";
import { useStep } from "../../designSystem/stepper/Stepper";
import { Form, Formik } from "formik";
import CurrencySelectorV2 from "./CurrencySelector";
import { useUploadNote } from "../../../hooks/useUploadNote";
import { notionOnboardingLink } from "../../nux/NewUserModal";
import { useState } from "react";

interface Props {
  screenKey: string;
  isInvoice: boolean;
}

function CheqDetailsStep({ isInvoice }: Props) {
  const { next, appendFormData, formData } = useStep();
  const { uploadNote } = useUploadNote();
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
}

export default CheqDetailsStep;
