import { Box, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import type { ReactNode } from "react";
import type {
  PaymentTermsErrors,
  PaymentTermsValues,
} from "../../../../utils/paymentTerms/types";
import { formTheme } from "../../../designSystem/form/formTheme";
import InfoTooltip from "../../../designSystem/InfoTooltip";
import { termsTheme } from "../termsTheme";

/**
 * Error to show for a field: present, and either touched or non-empty. Seeded
 * blanks stay quiet until the person reaches them; relational errors on real
 * values show immediately and clear as soon as the value is edited.
 */
export function useTermsFieldError(
  name: keyof PaymentTermsValues
): string | undefined {
  const { errors, touched, values } = useFormikContext<PaymentTermsValues>();
  const error = (errors as PaymentTermsErrors)[name];
  if (!error) {
    return undefined;
  }
  const value = values[name];
  const nonEmpty =
    typeof value === "string" ? value.trim() !== "" : value !== undefined;
  return touched[name] || nonEmpty ? error : undefined;
}

export function FieldLabel({
  children,
  tooltip,
  htmlFor,
}: {
  children: ReactNode;
  tooltip?: string;
  htmlFor?: string;
}) {
  const styleProps = {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: formTheme.text,
    mb: 2,
  } as const;
  const content = (
    <>
      {children}
      {tooltip ? <InfoTooltip label={tooltip} /> : null}
    </>
  );
  if (htmlFor) {
    return (
      <Text as="label" htmlFor={htmlFor} {...styleProps}>
        {content}
      </Text>
    );
  }
  return (
    <Text as="span" {...styleProps}>
      {content}
    </Text>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <Text
      role="alert"
      mt={1.5}
      fontSize={termsTheme.errorFontSize}
      fontWeight={500}
      color={formTheme.error}
    >
      {message}
    </Text>
  );
}

export function FieldHelp({ children }: { children: ReactNode }) {
  return (
    <Text mt={1.5} fontSize="13px" lineHeight={1.45} color={formTheme.muted}>
      {children}
    </Text>
  );
}

/** Vertical rhythm between fields inside a promoted card. */
export function FieldStack({ children }: { children: ReactNode }) {
  return (
    <Box display="flex" flexDirection="column" gap={4}>
      {children}
    </Box>
  );
}
