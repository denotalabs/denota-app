import {
  Flex,
  FormControl,
  FormLabel,
  Stack,
} from "@chakra-ui/react";
import { useFormikContext } from "formik";
import {
  RECOVERABLE_ALWAYS,
  REVERSIBLE_BEFORE_DATE,
} from "../../../utils/reversibleModule";
import InfoTooltip from "../../designSystem/InfoTooltip";
import RadioButtonField from "../../fields/RadioButtonField";
import AccountField from "../../fields/input/AccountField";
import DateTimeLocalField from "../../fields/input/DateTimeLocalField";

const REVERSIBLE_WHEN_OPTIONS = [
  {
    value: RECOVERABLE_ALWAYS,
    label: "Always",
    description:
      "Arbitrator can reverse or release at any time — good for services or items not yet delivered.",
  },
  {
    value: REVERSIBLE_BEFORE_DATE,
    label: "Before a date",
    description:
      "Choose this when expecting delivery or completion by a deadline — arbitrator can reverse until inspection ends.",
  },
];

export function EscrowTerms() {
  const { values } = useFormikContext<{
    recoverableWhen: string;
  }>();

  const showInspectionEnd = values.recoverableWhen === REVERSIBLE_BEFORE_DATE;

  return (
    <Flex flexWrap="wrap" direction="column" gap="18px">
      <Stack spacing={5}>
        <FormControl>
          <FormLabel noOfLines={1} flexShrink={0}>
            Arbitrator
            <InfoTooltip label="Party responsible for reversing or releasing the payment. Leave empty to use your connected address." />
          </FormLabel>
          <AccountField
            fieldName="auditor"
            resolvedFieldName="resolvedAuditor"
            allowEns
            isRequired={false}
            placeholder="almaraz.eth, 0x..."
          />
        </FormControl>

        <RadioButtonField
          fieldName="recoverableWhen"
          label="Reversible when:"
          options={REVERSIBLE_WHEN_OPTIONS}
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
    </Flex>
  );
}
