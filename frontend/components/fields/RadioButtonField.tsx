import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";

import { Field } from "formik";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface Props {
  fieldName: string;
  label: string;
  options: RadioOption[];
}

function RadioButtonField({ fieldName, options, label }: Props) {
  return (
    <Field name={fieldName}>
      {({ field, form: { errors, touched, setFieldValue } }: any) => (
        <FormControl isInvalid={errors[fieldName] && touched[fieldName]}>
          <FormLabel>{label}</FormLabel>
          <RadioGroup
            value={field.value}
            onChange={(val) => setFieldValue(fieldName, val)}
          >
            <Stack spacing={3}>
              {options.map((option) => (
                <Stack key={option.value} spacing={0.5}>
                  <Radio value={option.value}>{option.label}</Radio>
                  {option.description ? (
                    <Text fontSize="sm" color="whiteAlpha.700" pl={6}>
                      {option.description}
                    </Text>
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </RadioGroup>
          <FormErrorMessage>{errors[fieldName]}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default RadioButtonField;
