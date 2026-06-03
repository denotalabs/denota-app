import { Flex, Stack } from "@chakra-ui/react";
import DateTimeLocalField from "../../fields/input/DateTimeLocalField";

export function ClaimableTerms() {
  return (
    <Flex flexWrap={"wrap"} direction={"column"}>
      <Stack spacing={5}>
        <DateTimeLocalField
          fieldName="expirationDate"
          label="Must claim before:"
          helperText="Optional. Leave blank for no deadline. Time is local and includes seconds."
        />
      </Stack>
    </Flex>
  );
}
