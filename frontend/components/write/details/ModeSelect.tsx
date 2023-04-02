import { Select } from "@chakra-ui/react";
import { Field, FieldProps } from "formik";

function ModeSelect() {
  return (
    <Field name="mode">
      {({
        field,
        form: { setFieldValue, setFieldTouched, values },
      }: FieldProps) => (
        <Select
          w={120}
          {...field}
          onChange={(event) => {
            console.log("mode changed");
            setFieldValue("mode", event.target.value);
          }}
          onBlur={() => setFieldTouched("mode", true)}
          value={values.mode}
        >
          <option value="invoice">Invoice</option>
          <option value="pay">Payment</option>
        </Select>
      )}
    </Field>
  );
}

export default ModeSelect;
