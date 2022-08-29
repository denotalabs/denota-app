import { Field } from "formik";

import {
  FormControl,
  FormErrorMessage,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";

function DurationField() {
  // TODO add time validation
  // function validateDuration(value: string) {
  // }

  // TODO figure out if this should just be a drop down select instead
  return (
    <Field
      name={"duration"}
      // validate={validateDuration}
    >
      {({ field, form: { setFieldValue, errors, touched } }: any) => (
        <FormControl isInvalid={errors.amount && touched.amount}>
          <NumberInput
            {...field}
            onChange={(val) => setFieldValue(field.name, val)}
            min={0}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>{errors.amount}</FormErrorMessage>
        </FormControl>
      )}
    </Field>
  );
}

export default DurationField;
