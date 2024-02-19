import { Flex, Stack, Text } from "@chakra-ui/react";

export function DirectPayTerms() {
  return (
    <Flex flexWrap={"wrap"} direction={"column"}>
      <Text fontSize="lg" mb={5} fontWeight={600}>
        {"Funds will be released immediately upon payment."}
      </Text>
      <Stack spacing={5}></Stack>
    </Flex>
  );
}
