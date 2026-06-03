import { QuestionOutlineIcon } from "@chakra-ui/icons";
import {
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Stack,
  Tooltip,
} from "@chakra-ui/react";
import { useFormikContext } from "formik";
import {
  RECOVERABLE_ALWAYS,
  REVERSIBLE_BEFORE_DATE,
} from "../../../utils/reversibleModule";
import RadioButtonField from "../../fields/RadioButtonField";
import AccountField from "../../fields/input/AccountField";
import DateTimeLocalField from "../../fields/input/DateTimeLocalField";

export function EscrowTerms() {
  const { values } = useFormikContext<{
    recoverableWhen: string;
  }>();

  const showInspectionEnd = values.recoverableWhen === REVERSIBLE_BEFORE_DATE;

  return (
    <Flex flexWrap={"wrap"} direction={"column"} gap={"18px"}>
      <HStack align="flex-start" spacing={6}>
        <Stack flex={1} spacing={5}>
          <RadioButtonField
            fieldName="recoverableWhen"
            label="Reversible when:"
            values={[RECOVERABLE_ALWAYS, REVERSIBLE_BEFORE_DATE]}
          />
          {showInspectionEnd && (
            <DateTimeLocalField
              fieldName="inspectionEndDate"
              label="Inspection end:"
              tooltipLabel="Last moment the arbitrator can reverse or release funds. After this, only the recipient can receive the funds."
              helperText="Time is local and includes seconds."
            />
          )}
        </Stack>
        <FormControl flex={1}>
          <FormLabel noOfLines={1} flexShrink={0}>
            Reversible by:
            <Tooltip
              label="Party responsible for reversing or releasing the payment. Leave empty to use your connected address."
              aria-label="module tooltip"
              placement="right"
            >
              <QuestionOutlineIcon ml={2} mb={1} />
            </Tooltip>
          </FormLabel>
          <AccountField
            fieldName="auditor"
            resolvedFieldName="resolvedAuditor"
            allowEns
            isRequired={false}
            placeholder="almaraz.eth, 0x..."
          />
        </FormControl>
      </HStack>
    </Flex>
  );
}
