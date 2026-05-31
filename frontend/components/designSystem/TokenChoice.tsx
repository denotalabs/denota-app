import { Box, useRadio, UseRadioProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface TokenChoiceProps {
  children: ReactNode;
  radioProps: UseRadioProps;
}

export function TokenChoice({ radioProps, children }: TokenChoiceProps) {
  const { getInputProps, getRadioProps } = useRadio(radioProps);

  const input = getInputProps();
  const radio = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...radio}
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
