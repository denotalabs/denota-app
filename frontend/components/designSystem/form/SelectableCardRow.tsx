import {
  Box,
  type BoxProps,
  Flex,
  type FlexProps,
  Text,
  type TextProps,
  useRadio,
  type UseRadioProps,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { formTheme } from "./formTheme";

const cardBaseProps = {
  border: "1px solid",
  borderColor: "brand.500",
  bg: "brand.600",
  _hover: { borderColor: "notaPurple.100" },
};

const cardCheckedSx = {
  borderColor: "brand.200",
  bg: "brand.300",
  boxShadow: "0 0 0 1px var(--chakra-colors-brand-200) inset",
  _hover: { borderColor: "brand.200" },
};

interface Props {
  radioProps: UseRadioProps;
  title: string;
  /** Leading visual (icon or glyph); receives the checked state. */
  leading: (isChecked: boolean) => ReactNode;
  flex?: BoxProps["flex"];
  px?: FlexProps["px"];
  gap?: FlexProps["gap"];
  titleFontSize?: TextProps["fontSize"];
}

/** A radio option rendered as a selectable card with a check mark. */
export function SelectableCardRow({
  radioProps,
  title,
  leading,
  flex,
  px = 4,
  gap = 3,
  titleFontSize = "16px",
}: Props) {
  const { state, getInputProps, getRadioProps } = useRadio(radioProps);
  const { isChecked } = state;

  return (
    <Box as="label" w="100%" minW={0} flex={flex} textAlign="left">
      <input {...getInputProps()} />
      <Flex
        {...getRadioProps()}
        align="center"
        gap={gap}
        cursor="pointer"
        borderRadius="16px"
        px={px}
        py={2}
        minH={{ base: "56px", md: "50px" }}
        {...cardBaseProps}
        _checked={cardCheckedSx}
      >
        {leading(isChecked)}
        <Text
          fontSize={titleFontSize}
          fontWeight={isChecked ? 700 : 600}
          color={isChecked ? formTheme.textDark : formTheme.mutedLight}
          noOfLines={1}
        >
          {title}
        </Text>
      </Flex>
    </Box>
  );
}
