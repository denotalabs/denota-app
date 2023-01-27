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

// TODO - make extensible to support only balance in wallet, etc
function AmountField() {
  // TODO validate function (could check user wallet)
  //   function validateAmount(value: string) {
  //   }
  return (
    <Field
      name="amount"
      // validate={validateAmount}
    >
      {({ field, form: { setFieldValue, errors, touched, values } }: any) => (
        <FormControl isInvalid={errors.amount && touched.amount}>
          <NumberInput
            {...field}
            onChange={(val) => setFieldValue(field.name, val)}
            precision={2}
            step={0.1}
            min={0}
            value={values.amount}
            // TODO add max, set by user's balance
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

export default AmountField;
