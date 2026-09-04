import { Box, Text } from "@chakra-ui/react";
import { formTheme } from "../../../designSystem/form/formTheme";
import { termsTheme } from "../termsTheme";

/** Dashed stand-in for a repeatable editor that is not built yet. */
export function PlaceholderEditor({ children }: { children: string }) {
  return (
    <Box
      px={3.5}
      py={3}
      bg="brand.400"
      border={termsTheme.hairline}
      borderStyle="dashed"
      borderRadius="10px"
    >
      <Text fontSize="13px" lineHeight={1.5} color={formTheme.mutedLight}>
        {children}
      </Text>
    </Box>
  );
}
