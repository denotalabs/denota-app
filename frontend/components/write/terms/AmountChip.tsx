import { Flex, Text } from "@chakra-ui/react";
import { formTheme } from "../../designSystem/form/formTheme";
import { termsTheme } from "./termsTheme";

interface Props {
  amount: string | undefined;
  tokenLabel: string;
}

/** Non-editable reminder of the amount every term acts on. */
export function AmountChip({ amount, tokenLabel }: Props) {
  const value = amount?.trim() || "0";
  return (
    <Flex
      as="span"
      display="inline-flex"
      align="center"
      gap={1.5}
      px={3}
      py={1.5}
      borderRadius="full"
      bg="brand.400"
      border={termsTheme.hairline}
      fontSize="13px"
      color={formTheme.mutedLight}
      aria-label={`Configuring terms for ${value} ${tokenLabel}`}
    >
      <Text as="span">Configuring terms for</Text>
      <Text as="span" fontWeight={700} color={formTheme.textDark}>
        {value} {tokenLabel}
      </Text>
    </Flex>
  );
}
