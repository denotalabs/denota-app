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
        "& input": { color: formTheme.text, bg: "transparent" },
        "& input::placeholder": { color: formTheme.placeholder },
        "& input:focus": { outline: "none", boxShadow: "none" },
        "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active":
          {
            WebkitBoxShadow:
              "0 0 0 1000px var(--chakra-colors-brand-400) inset",
            WebkitTextFillColor: "var(--chakra-colors-whiteAlpha-900)",
            caretColor: "var(--chakra-colors-whiteAlpha-900)",
            transition: "background-color 9999s ease-out 0s",
          },
      }}
      {...props}
    >
      {children}
    </Flex>
  );
}
