import { Flex, type FlexProps } from "@chakra-ui/react";
import { formTheme } from "./formTheme";

type BorderState = "default" | "invalid";

interface Props extends FlexProps {
  borderState?: BorderState;
  children: React.ReactNode;
}

/** Rounded input container with focus/invalid border treatment. */
export function FormInputWrap({
  borderState = "default",
  children,
  ...props
}: Props) {
  const isInvalid = borderState === "invalid";

  return (
    <Flex
      align="center"
      gap={2}
      bg="brand.400"
      border="1px solid"
      borderColor={isInvalid ? formTheme.error : formTheme.borderDefault}
      borderRadius="16px"
      px={{ base: 4, md: 3 }}
      pl={{ base: 4, md: 4 }}
      minH={{ base: "56px", md: "50px" }}
      _focusWithin={{
        borderColor: isInvalid ? formTheme.error : "notaPurple.100",
        boxShadow: isInvalid
          ? "0 0 0 1px var(--chakra-colors-red-400) inset"
          : "0 0 0 1px var(--chakra-colors-notaPurple-100) inset",
      }}
      sx={{
        "& input": { color: formTheme.text },
        "& input::placeholder": { color: formTheme.placeholder },
        "& input:focus": { outline: "none", boxShadow: "none" },
      }}
      {...props}
    >
      {children}
    </Flex>
  );
}
