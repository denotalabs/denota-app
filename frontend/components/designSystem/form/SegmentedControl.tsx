import { Box, Flex } from "@chakra-ui/react";
import { formTheme } from "./formTheme";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  name: string;
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  "aria-label"?: string;
}

/** iOS-style equal-width segments in a single track. */
export function SegmentedControl<T extends string>({
  name,
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
}: Props<T>) {
  return (
    <Flex
      role="radiogroup"
      aria-label={ariaLabel}
      p="3px"
      bg="brand.300"
      border="1px solid"
      borderColor="brand.500"
      borderRadius="14px"
      gap="2px"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Box
            key={option.value}
            as="button"
            type="button"
            role="radio"
            name={name}
            aria-checked={isSelected}
            display="flex"
            alignItems="center"
            justifyContent="center"
            flex={1}
            minW={0}
            minH="40px"
            px={1.5}
            border="0"
            borderRadius="11px"
            cursor="pointer"
            lineHeight="1.2"
            fontSize="13px"
            fontWeight={isSelected ? 700 : 600}
            letterSpacing="-0.2px"
            color={isSelected ? formTheme.textDark : formTheme.mutedLight}
            bg={isSelected ? "brand.100" : "transparent"}
            boxShadow={
              isSelected ? "0 1px 3px rgba(0, 0, 0, 0.08)" : undefined
            }
            whiteSpace="nowrap"
            overflow="hidden"
            textOverflow="ellipsis"
            transition="background 0.15s, color 0.15s, box-shadow 0.15s"
            _hover={{
              color: formTheme.textDark,
            }}
            _active={{
              bg: isSelected ? "brand.100" : "transparent",
            }}
            sx={{ WebkitTapHighlightColor: "transparent" }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "brand.200",
              outlineOffset: "2px",
            }}
            onClick={() => {
              if (!isSelected) {
                onChange(option.value);
              }
            }}
          >
            {option.label}
          </Box>
        );
      })}
    </Flex>
  );
}
