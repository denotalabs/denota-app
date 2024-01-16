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
          {...field}
          onChange={(event) => setFieldValue("inspection", event.target.value)}
          onBlur={() => setFieldTouched("inspection", true)}
          value={values.inspection}
          w="200px"
        >
          <option value={86400}>1 day</option>
          <option value={604800}>1 week</option>
          <option value={2592000}>1 month</option>
        </Select>
      )}
    </Field>
  );
}

export default Inspection;
