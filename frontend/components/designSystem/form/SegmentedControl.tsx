import { Box, Flex, Text, type BoxProps } from "@chakra-ui/react";
import { formTheme } from "./formTheme";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  /** Maturity label, e.g. "Coming soon", stacked under the option text. */
  tag?: string | null;
  /** Greyed out and not selectable. */
  disabled?: boolean;
}

interface Props<T extends string> {
  name: string;
  value: T;
  options: SegmentedControlOption<T>[];
  onChange: (value: T) => void;
  "aria-label"?: string;
  /**
   * `fill` stretches equal-width segments across the track.
   * `intrinsic` sizes to content so callers can measure overflow.
   */
  layout?: "fill" | "intrinsic";
  /** Non-interactive clone used to measure intrinsic width. */
  inert?: boolean;
}

function segmentShellProps(isIntrinsic: boolean): BoxProps {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: isIntrinsic ? "none" : 1,
    minW: isIntrinsic ? "max-content" : 0,
    minH: "40px",
    py: "6px",
    px: 1.5,
    border: "0",
    borderRadius: "11px",
    lineHeight: "1.2",
    fontSize: "13px",
    letterSpacing: "-0.2px",
    whiteSpace: "nowrap",
    overflow: isIntrinsic ? "visible" : "hidden",
    textOverflow: isIntrinsic ? undefined : "ellipsis",
    transition: "background 0.15s, color 0.15s, box-shadow 0.15s",
    sx: { WebkitTapHighlightColor: "transparent" },
  };
}

function SegmentLabel({
  label,
  tag,
}: {
  label: string;
  tag?: string | null;
}) {
  return (
    <Flex direction="column" align="center" justify="center" gap="1px">
      <Box as="span">{label}</Box>
      {tag ? (
        <Text
          as="span"
          fontSize="9px"
          fontWeight={600}
          lineHeight="1.2"
          letterSpacing="0"
          color={formTheme.mutedFaded}
        >
          {tag}
        </Text>
      ) : null}
    </Flex>
  );
}

/** iOS-style equal-width segments in a single track. */
export function SegmentedControl<T extends string>({
  name,
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
  layout = "fill",
  inert = false,
}: Props<T>) {
  const isIntrinsic = layout === "intrinsic";
  const shell = segmentShellProps(isIntrinsic);

  return (
    <Flex
      role={inert ? undefined : "radiogroup"}
      aria-hidden={inert || undefined}
      aria-label={inert ? undefined : ariaLabel}
      w={isIntrinsic ? "max-content" : "100%"}
      p="3px"
      bg="brand.300"
      border="1px solid"
      borderColor="brand.500"
      borderRadius="14px"
      gap="2px"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const isDisabled = Boolean(option.disabled);
        const selectedProps: BoxProps = {
          fontWeight: isSelected ? 700 : 600,
          color: isDisabled
            ? formTheme.placeholder
            : isSelected
              ? formTheme.textDark
              : formTheme.mutedLight,
          bg: isSelected && !isDisabled ? "brand.100" : "transparent",
          boxShadow:
            isSelected && !isDisabled
              ? "0 1px 3px rgba(0, 0, 0, 0.08)"
              : undefined,
          opacity: isDisabled ? 0.7 : 1,
        };

        if (inert) {
          return (
            <Box key={option.value} {...shell} {...selectedProps}>
              <SegmentLabel label={option.label} tag={option.tag} />
            </Box>
          );
        }

        return (
          <Box
            key={option.value}
            as="button"
            type="button"
            role="radio"
            name={name}
            aria-checked={isSelected}
            aria-disabled={isDisabled || undefined}
            disabled={isDisabled}
            cursor={isDisabled ? "not-allowed" : "pointer"}
            _hover={
              isDisabled ? undefined : { color: formTheme.textDark }
            }
            _active={{
              bg: isSelected && !isDisabled ? "brand.100" : "transparent",
            }}
            _focusVisible={{
              outline: "2px solid",
              outlineColor: "brand.200",
              outlineOffset: "2px",
            }}
            onClick={() => {
              if (isDisabled || isSelected) {
                return;
              }
              onChange(option.value);
            }}
            {...shell}
            {...selectedProps}
          >
            <SegmentLabel label={option.label} tag={option.tag} />
          </Box>
        );
      })}
    </Flex>
  );
}
