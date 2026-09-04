import { Box, Input, Text, Textarea } from "@chakra-ui/react";
import { Field, FieldProps } from "formik";
import type { ReactNode } from "react";
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
  placeholder?: string;
  tooltip?: string;
  help?: string;
  /** Trailing unit, e.g. a token symbol. */
  suffix?: string;
  inputMode?: "text" | "decimal" | "numeric";
  multiline?: boolean;
  /** Rendered under the input; use for derived readouts. */
  readout?: ReactNode;
}

/** Text / number input with inline error and optional derived readout. */
export function TermsTextField({
  name,
  label,
  placeholder,
  tooltip,
  help,
  suffix,
  inputMode = "text",
  multiline = false,
  readout,
}: Props) {
  const error = useTermsFieldError(name);
  const id = `terms-${name}`;
  return (
    <Box>
      {label ? (
        <FieldLabel htmlFor={id} tooltip={tooltip}>
          {label}
        </FieldLabel>
      ) : null}
      <Field name={name}>
        {({ field }: FieldProps) =>
          multiline ? (
            <FormInputWrap
              borderState={error ? "invalid" : "default"}
              minH="auto"
              py={2}
            >
              <Textarea
                {...field}
                id={id}
                variant="unstyled"
                placeholder={placeholder}
                rows={3}
                fontSize={{ base: "16px", md: "15px" }}
                fontFamily="mono"
                color={formTheme.text}
                resize="vertical"
                spellCheck={false}
                aria-invalid={Boolean(error)}
                _placeholder={{ color: formTheme.placeholder }}
              />
            </FormInputWrap>
          ) : (
            <FormInputWrap borderState={error ? "invalid" : "default"}>
              <Input
                {...field}
                id={id}
                variant="unstyled"
                flex={1}
                minW={0}
                h={{ base: "54px", md: "48px" }}
                fontSize={{ base: "16px", md: "15px" }}
                color={formTheme.text}
                placeholder={placeholder}
                inputMode={inputMode}
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(error)}
              />
              {suffix ? (
                <Text
                  fontSize="13px"
                  fontWeight={700}
                  color={formTheme.mutedLight}
                  flexShrink={0}
                >
                  {suffix}
                </Text>
              ) : null}
            </FormInputWrap>
          )
        }
      </Field>
      <FieldError message={error} />
      {!error && readout ? (
        <Text mt={1.5} fontSize="13px" color="brand.200" fontWeight={600}>
          {readout}
        </Text>
      ) : null}
      {!error && !readout && help ? <FieldHelp>{help}</FieldHelp> : null}
    </Box>
  );
}
