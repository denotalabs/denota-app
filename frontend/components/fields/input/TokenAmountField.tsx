import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/react";
import { Field, FieldProps } from "formik";
import { useTokens } from "../../../hooks/useTokens";
import { NotaCurrency } from "../../designSystem/CurrencyIcon";

interface Props {
  fieldName: string;
  label: string;
  token: NotaCurrency;
  helperText?: string;
}

function TokenAmountField({ fieldName, label, token, helperText }: Props) {
  const { getTokenUnits } = useTokens();
  const precision = token === "UNKNOWN" ? 18 : getTokenUnits(token);

  return (
    <Field name={fieldName}>
      {({ field, form: { setFieldValue, errors, values, touched } }: FieldProps) => {
        const showError = Boolean(errors[fieldName] && touched[fieldName]);

        return (
          <FormControl isInvalid={showError}>
            <FormLabel>{label}</FormLabel>
            <NumberInput
              {...field}
              onChange={(val) => setFieldValue(field.name, val)}
              precision={precision}
              step={precision <= 6 ? 0.000001 : 0.0001}
              min={0}
              value={values[fieldName] ?? ""}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
            <FormErrorMessage>{errors[fieldName]?.toString()}</FormErrorMessage>
          </FormControl>
        );
      }}
    </Field>
  );
}

export default TokenAmountField;
