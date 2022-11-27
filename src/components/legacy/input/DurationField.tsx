import { Field } from "formik";

import { FormControl, FormErrorMessage, Select } from "@chakra-ui/react";

function DurationField() {
  return (
    <Field name="duration">
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.duration && touched.duration}>
          <Select defaultValue={60} placeholder="1 minute">
            <option value={3600}>1 hour</option>
            <option value={86400}>1 day</option>
            <option value={604800}>1 week</option>
            <option value={18144000}>1 month</option>
          </Select>
          <FormErrorMessage>{errors.duration}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default DurationField;
