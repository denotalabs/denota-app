import { Box, Input } from "@chakra-ui/react";
import { Field, FieldProps } from "formik";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { FormInputWrap } from "../../../designSystem/form/FormInputWrap";
import { formTheme } from "../../../designSystem/form/formTheme";
import {
  FieldError,
  FieldHelp,
  FieldLabel,
  useTermsFieldError,
} from "./FieldChrome";

interface Props {
  name: keyof PaymentTermsValues;
  label: string;
  tooltip?: string;
  help?: string;
}

/** Local datetime input with inline relational error. */
export function TermsDateField({ name, label, tooltip, help }: Props) {
  const error = useTermsFieldError(name);
  const id = `terms-${name}`;
  return (
    <Box>
      <FieldLabel htmlFor={id} tooltip={tooltip}>
        {label}
      </FieldLabel>
      <Field name={name}>
        {({ field }: FieldProps) => (
          <FormInputWrap borderState={error ? "invalid" : "default"}>
            <Input
              {...field}
              id={id}
              type="datetime-local"
              step={1}
              variant="unstyled"
              flex={1}
              minW={0}
              h={{ base: "54px", md: "48px" }}
              fontSize={{ base: "16px", md: "15px" }}
              color={formTheme.text}
              aria-invalid={Boolean(error)}
              style={{ colorScheme: "dark" }}
            />
          </FormInputWrap>
        )}
      </Field>
      <FieldError message={error} />
      {!error && help ? <FieldHelp>{help}</FieldHelp> : null}
    </Box>
  );
}
