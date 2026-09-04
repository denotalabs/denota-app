import { Box, Flex, Tag, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { formTheme } from "../../../designSystem/form/formTheme";
import { termsTheme } from "../termsTheme";
import { FieldLabel } from "./FieldChrome";

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  /** One line shown under the group while this option is selected. */
  description?: string;
  /** Maturity label, e.g. "Coming soon". Selectable, but marks a dead end. */
  tag?: string | null;
}

interface Props<K extends keyof PaymentTermsValues, V extends string> {
  name: K;
  label: string;
  tooltip?: string;
  options: ChoiceOption<V>[];
  /** Called after the value changes, for dependent-field resets. */
  onChange?: (value: V) => void;
}

/**
 * A question with pill answers. Only the selected answer's description shows,
 * so the group stays compact while still explaining the choice.
 */
export function ChoiceField<
  K extends keyof PaymentTermsValues,
  V extends PaymentTermsValues[K] & string
>({ name, label, tooltip, options, onChange }: Props<K, V>) {
  const { values, setFieldValue } = useFormikContext<PaymentTermsValues>();
  const current = values[name] as V;
  const selected = options.find((option) => option.value === current);

  return (
    <Box role="radiogroup" aria-label={label}>
      <FieldLabel tooltip={tooltip}>{label}</FieldLabel>
      <Flex gap={2} flexWrap="wrap">
        {options.map((option) => {
          const isSelected = option.value === current;
          return (
            <Box
              key={option.value}
              as="button"
              type="button"
              role="radio"
              aria-checked={isSelected}
              display="inline-flex"
              alignItems="center"
              gap={1.5}
              px={3}
              py={1.5}
              minH="34px"
              borderRadius="full"
              fontSize="13px"
              fontWeight={isSelected ? 700 : 600}
              color={isSelected ? formTheme.textDark : formTheme.mutedLight}
              bg={isSelected ? "brand.300" : "brand.400"}
              border={isSelected ? "1px solid" : termsTheme.hairline}
              borderColor={isSelected ? "brand.200" : undefined}
              boxShadow={
                isSelected
                  ? "0 0 0 1px var(--chakra-colors-brand-200) inset"
                  : undefined
              }
              transition="border-color 0.15s, background 0.15s, color 0.15s"
              _hover={{
                borderColor: isSelected ? "brand.200" : "notaPurple.100",
                color: formTheme.textDark,
              }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "brand.200",
                outlineOffset: "2px",
              }}
              onClick={() => {
                if (isSelected) {
                  return;
                }
                setFieldValue(name, option.value);
                onChange?.(option.value);
              }}
            >
              {option.label}
              {option.tag ? (
                <Tag
                  size="sm"
                  variant="subtle"
                  colorScheme="gray"
                  borderRadius="full"
                  fontSize="10px"
                  px={1.5}
                  minH="18px"
                >
                  {option.tag}
                </Tag>
              ) : null}
            </Box>
          );
        })}
      </Flex>
      {selected?.description ? (
        <Text
          mt={2}
          fontSize="13px"
          lineHeight={1.5}
          color={formTheme.mutedLight}
        >
          {selected.description}
        </Text>
      ) : null}
    </Box>
  );
}
