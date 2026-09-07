import { Text } from "@chakra-ui/react";
import { formTheme } from "../../designSystem/form/formTheme";

interface Props {
  amount: string | undefined;
  tokenLabel: string;
}

/** Centered reminder of the amount every term acts on. */
export function TermsAmountHint({ amount, tokenLabel }: Props) {
  const value = amount?.trim() || "0";
  return (
    <Text
      w="100%"
      textAlign="center"
      fontSize="13px"
      color={formTheme.mutedLight}
    >
      Configuring terms for{" "}
      <Text as="span" fontWeight={700} color={formTheme.textDark}>
        {value} {tokenLabel}
      </Text>
    </Text>
  );
}
