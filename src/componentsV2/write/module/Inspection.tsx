import { Select } from "@chakra-ui/react";
import { Field } from "formik";

function Inspection() {
  return (
    <Field
      name="inspection"
      // validate={validateAmount}
    >
      {({
        field,
        form: { setFieldValue, setFieldTouched, errors, touched, values },
      }: any) => (
        <Select
          w={120}
          placeholder="Select"
          {...field}
          onChange={(value) => setFieldValue("inspection", value)}
          onBlur={() => setFieldTouched("inspection", true)}
          value={values.inspection}
        >
          <option value="90">90 days</option>
          <option value="30">30 days</option>
        </Select>
      )}
    </Field>
  );
}

export default Inspection;
