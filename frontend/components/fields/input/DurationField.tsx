import { Field } from "formik";

import { FormControl, FormErrorMessage } from "@chakra-ui/react";

function DurationField() {
  return (
    <Field name="duration">
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.duration && touched.duration}>
          <input type="date"></input>
          <FormErrorMessage>{errors.duration}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default DurationField;
