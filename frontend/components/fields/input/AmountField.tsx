import { Field, FieldProps } from "formik";

import {
  FormControl,
  FormErrorMessage,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/react";
import { useCallback, useState } from "react";

interface Props {
  allowZero?: boolean;
}

function AmountField({ allowZero = false }: Props) {
  const [hasStarted, setHasStarted] = useState(false);

  const validateAmount = useCallback(
    (value: number) => {
      setHasStarted(true);
      if (allowZero && value >= 0) {
        return undefined;
      }
      if (value <= 0) {
        return "Value must be greater than 0";
      }
      return undefined;
    },
    [allowZero]
  );

  return (
    <Field name="amount" validate={validateAmount}>
      {({ field, form: { setFieldValue, errors, values, touched } }: FieldProps) => {
        const showError = Boolean(
          errors.amount && (hasStarted || touched.amount)
        );

        return (
          <FormControl isInvalid={showError}>
            <NumberInput
              {...field}
              onChange={(val) => setFieldValue(field.name, val)}
              precision={2}
              step={1}
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
            <FormErrorMessage>
              {errors.amount && errors.amount.toString()}
            </FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}

export default AmountField;
