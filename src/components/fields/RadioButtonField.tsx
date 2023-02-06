import { Field } from "formik";

import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Radio,
  RadioGroup,
} from "@chakra-ui/react";

interface Props {
  fieldName: string;
  label: string;
  values: string[]; // TODO: make into array
}

function RadioButtonField({ fieldName, values, label }: Props) {
  return (
    <Field name={fieldName}>
      {({ field, form: { errors, touched } }: any) => (
        <FormControl isInvalid={errors.name && touched.name}>
          <FormLabel>{label}</FormLabel>
          <RadioGroup {...field}>
            {values.map((value) => (
              <div key={value}>
                <Radio {...field} value={value}>
                  {value}
                </Radio>
                <br />
              </div>
            ))}
          </RadioGroup>
          <FormErrorMessage>{errors.name}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default RadioButtonField;
