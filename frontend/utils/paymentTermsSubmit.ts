import { FormikProps } from "formik";

type PaymentTermsFormStatus = {
  erc721Checking?: boolean;
};

export function isPaymentTermsSubmitDisabled(
  props: Pick<FormikProps<unknown>, "errors" | "status">
): boolean {
  const status = props.status as PaymentTermsFormStatus | undefined;
  return (
    Object.keys(props.errors).length > 0 || status?.erc721Checking === true
  );
}
