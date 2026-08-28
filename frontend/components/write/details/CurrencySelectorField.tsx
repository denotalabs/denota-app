import { Field, FieldProps } from "formik";
import { FormSection } from "../../designSystem/form/FormSection";
import { TokenSelector } from "./TokenSelector";

export function CurrencySelectorField() {
  return (
    <Field name="token">
      {({ form: { setFieldValue, values } }: FieldProps) => (
        <FormSection label="What Currency?">
          <TokenSelector
            value={values.token}
            onChange={(token) => setFieldValue("token", token)}
          />
        </FormSection>
      )}
    </Field>
  );
}
