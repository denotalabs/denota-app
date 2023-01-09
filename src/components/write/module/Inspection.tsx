import { Input, Select } from "@chakra-ui/react";
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
        // <Select
        //   w={120}
        //   {...field}
        //   onChange={(event) => setFieldValue("inspection", event.target.value)}
        //   onBlur={() => setFieldTouched("inspection", true)}
        //   value={values.inspection}
        // >
        //   <option value={86400}>1 day</option>
        //   <option value={604800}>1 week</option>
        //   <option value={18144000}>1 month</option>
        // </Select>
        <Input
          type="date"
          {...field}
          onChange={(event) => {
            console.log(event);
          }}
        />
      )}
    </Field>
  );
}

export default Inspection;
