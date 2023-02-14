import { QuestionOutlineIcon } from "@chakra-ui/icons";
import { Flex, FormLabel, Input, Text, Tooltip } from "@chakra-ui/react";

export function DirectPay() {
  return (
    <Flex flexWrap={"wrap"} direction={"column"}>
      <Text fontSize="lg" mb={5} fontWeight={600}>
        {"Funds will be released immediately upon payment"}
      </Text>
      <FormLabel noOfLines={1} flexShrink={0} mb={3}>
        Due date
        <Tooltip
          label="The minimum payment required to start work"
          aria-label="module tooltip"
          placement="right"
        >
          <QuestionOutlineIcon ml={2} mb={1} />
        </Tooltip>
      </FormLabel>
      <Input
        type="date"
        w="200px"
        onChange={(event) => {
          console.log(event);
        }}
      />
    </Flex>
  );
}
