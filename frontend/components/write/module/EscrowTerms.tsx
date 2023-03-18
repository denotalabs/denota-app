import { QuestionOutlineIcon } from "@chakra-ui/icons";
import { Flex, FormControl, FormLabel, Tooltip } from "@chakra-ui/react";
import AccountField from "../../fields/input/AccountField";

export function EscrowTerms() {
  return (
    <Flex flexWrap={"wrap"} direction={"column"} gap={"18px"}>
      <FormControl>
        <FormLabel noOfLines={1} flexShrink={0}>
          Auditor
          <Tooltip
            label="Party responsible arbitrating disputes. Leave empty for self sign"
            aria-label="module tooltip"
            placement="right"
          >
            <QuestionOutlineIcon ml={2} mb={1} />
          </Tooltip>
        </FormLabel>
        <AccountField fieldName="auditor" placeholder="0x" />
      </FormControl>
    </Flex>
  );
}
