import { Field } from "formik";

import { Select } from "@chakra-ui/react";

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
          {...field}
          onChange={(event) => setFieldValue("inspection", event.target.value)}
          onBlur={() => setFieldTouched("inspection", true)}
          value={values.inspection}
        >
          <option value={86400}>1 day</option>
          <option value={604800}>1 week</option>
          <option value={18144000}>1 month</option>
        </Select>
      )}
    </Field>
  );
}

export default Inspection;
