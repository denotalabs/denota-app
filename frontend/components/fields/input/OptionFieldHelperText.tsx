import { FormHelperText, Text } from "@chakra-ui/react";

export default function OptionalFieldHelperText() {
  return (
    <FormHelperText mt={0} mb={2}>
      <Text as="i">optional</Text>
    </FormHelperText>
  );
}
