import { Box, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { formTheme } from "./formTheme";

interface Props {
  label: ReactNode;
  optional?: boolean;
  children: ReactNode;
  mb?: number | string;
}

/** A labeled section of a form: bold heading followed by the field(s). */
export function FormSection({ label, optional, children, mb = 5 }: Props) {
  return (
    <Box as="section" mb={mb}>
      {typeof label === "string" ? (
        <Text
          fontSize={{ base: "17px", md: "md" }}
          fontWeight={700}
          color={formTheme.text}
          display="block"
          mb={3.5}
        >
          {label}
          {optional ? (
            <Text
              as="span"
              color={formTheme.mutedFaded}
              fontWeight={400}
              fontSize={{ base: "14px", md: "sm" }}
            >
              {" "}
              (optional)
            </Text>
          ) : null}
        </Text>
      ) : (
        <Box mb={3.5}>{label}</Box>
      )}
      {children}
    </Box>
  );
}
