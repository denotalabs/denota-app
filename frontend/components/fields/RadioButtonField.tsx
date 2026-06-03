import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Radio,
  RadioGroup,
} from "@chakra-ui/react";

import { Field } from "formik";

interface Props {
  fieldName: string;
  label: string;
  values: string[]; // TODO: make into array
}

function RadioButtonField({ fieldName, values, label }: Props) {
  return (
    <Field name={fieldName}>
      {({ field, form: { errors, touched, setFieldValue } }: any) => (
        <FormControl
          isInvalid={errors[fieldName] && touched[fieldName]}
        >
          <FormLabel>{label}</FormLabel>
          <RadioGroup
            value={field.value}
            onChange={(val) => setFieldValue(fieldName, val)}
          >
            {values.map((value) => (
              <div key={value}>
                <Radio value={value}>{value}</Radio>
                <br />
              </div>
            ))}
          </RadioGroup>
          <FormErrorMessage>{errors[fieldName]}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default RadioButtonField;
