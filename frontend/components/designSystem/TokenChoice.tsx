import { Box, useRadio, UseRadioProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface TokenChoiceProps {
  children: ReactNode;
  radioProps: UseRadioProps;
}

export function TokenChoice({ radioProps, children }: TokenChoiceProps) {
  const { getInputProps, getCheckboxProps } = useRadio(radioProps);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="full"
        boxShadow="md"
        _checked={{
          bg: "teal.600",
          color: "white",
          borderColor: "teal.600",
        }}
        p={2}
      >
        {children}
      </Box>
    </Box>
  );
}
