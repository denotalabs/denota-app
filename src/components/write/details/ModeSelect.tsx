import { Select } from "@chakra-ui/react";
import { Field } from "formik";

interface Props {
  isInvoice: boolean;
}

function ModeSelect({ isInvoice }: Props) {
  return (
    <Field
      name="mode"
      // validate={validateAmount}
    >
      {({
        field,
        form: { setFieldValue, setFieldTouched, errors, touched, values },
      }: any) => (
        <Select
          w={120}
          {...field}
          onChange={(event) => {
            setFieldValue("mode", event.target.value);
          }}
          onBlur={() => setFieldTouched("mode", true)}
          value={values.mode}
        >
          <option value="invoice">Invoicing</option>
          <option value="pay">Paying</option>
        </Select>
      )}
    </Field>
  );
}

export default ModeSelect;
