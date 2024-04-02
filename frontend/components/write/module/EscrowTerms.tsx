import { QuestionOutlineIcon } from "@chakra-ui/icons";
import { Flex, FormControl, FormLabel, HStack, Tooltip } from "@chakra-ui/react";
import RadioButtonField from "../../fields/RadioButtonField";
import AccountField from "../../fields/input/AccountField";
import DurationField from "../../fields/input/DurationField";

export type PaymentTermsFormValues = {
  arbitrator: string;
};

export function EscrowTerms() {

  return (
    <Flex flexWrap={"wrap"} direction={"column"} gap={"18px"}>
      <HStack>
        <FormControl>
          <RadioButtonField fieldName="Recoverable When?" label="Recoverable When?" values={["Always", "Before Date"]} />
          <FormLabel noOfLines={1} flexShrink={0}>
            Inspection End?
            <Tooltip
              label="The date at which the inspection period ends"
              aria-label="module tooltip"
              placement="right"
            >
              <QuestionOutlineIcon ml={2} mb={1} />
            </Tooltip>
          </FormLabel>
          <DurationField />
        </FormControl>
        <FormControl>
          <FormLabel noOfLines={1} flexShrink={0}>
            Arbitrator
            <Tooltip
              label="Party responsible arbitrating disputes. Leave empty for it to be yourself"
              aria-label="module tooltip"
              placement="right"
            >
              <QuestionOutlineIcon ml={2} mb={1} />
            </Tooltip>
          </FormLabel>
          <AccountField fieldName="auditor" isRequired={false} placeholder="0x" />
        </FormControl>
      </HStack>
    </Flex>
  );
}
