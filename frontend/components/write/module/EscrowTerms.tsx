import { QuestionOutlineIcon } from "@chakra-ui/icons";
import { Flex, FormControl, FormLabel, Tooltip } from "@chakra-ui/react";
import AccountField from "../../fields/input/AccountField";
import Inspection from "./Inspection";

export function EscrowTerms() {
  return (
    <Flex flexWrap={"wrap"} direction={"column"} gap={"18px"}>
      <FormControl mt={5}>
        <FormLabel noOfLines={1} flexShrink={0}>
          Inspection Period
          <Tooltip
            label="The amount of time the payer has to request a refund"
            aria-label="module tooltip"
            placement="right"
          >
            <QuestionOutlineIcon ml={2} mb={1} />
          </Tooltip>
        </FormLabel>
        <Inspection />
      </FormControl>
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
