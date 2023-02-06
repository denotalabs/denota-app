import { Field } from "formik";

import { Select } from "@chakra-ui/react";

function ModuleSelect() {
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
          {...field}
          onChange={(event) => setFieldValue("module", event.target.value)}
          onBlur={() => setFieldTouched("module", true)}
          value={values.module}
          flexGrow={1}
        >
          <option value="self">Self-serve</option>
          <option value="byoa">BYOA</option>
        </Select>
      )}
    </Field>
  );
}

export default ModuleSelect;
