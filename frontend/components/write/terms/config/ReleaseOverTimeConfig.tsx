import { Box, Flex, Select } from "@chakra-ui/react";
import { Field, FieldProps, useFormikContext } from "formik";
import { DRIP_PERIOD_UNITS } from "../../../../utils/dripPeriod";
import { estimatedReleaseCount } from "../../../../utils/paymentTerms/summary";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { ChoiceField } from "../fields/ChoiceField";
import { FieldLabel, FieldStack } from "../fields/FieldChrome";
import { PlaceholderEditor } from "../fields/PlaceholderEditor";
import { TermsDateField } from "../fields/TermsDateField";
import { TermsTextField } from "../fields/TermsTextField";

interface Props {
  amount: string | undefined;
  tokenLabel: string;
}

function CustomFrequency() {
  return (
    <Box>
      <FieldLabel htmlFor="terms-chunkPeriodAmount">Every</FieldLabel>
      <Flex gap={2} align="flex-start">
        <Box flex={1} minW={0}>
          <TermsTextField
            name="chunkPeriodAmount"
            label=""
            inputMode="numeric"
            placeholder="1"
          />
        </Box>
        <Box flex={1.4} minW={0}>
          <Field name="chunkPeriodUnit">
            {({ field }: FieldProps) => (
              <Select
                {...field}
                h={{ base: "56px", md: "50px" }}
                bg="brand.400"
                borderColor="brand.500"
                borderRadius="16px"
                fontSize={{ base: "16px", md: "15px" }}
                _hover={{ borderColor: "notaPurple.100" }}
              >
                {DRIP_PERIOD_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </Box>
      </Flex>
    </Box>
  );
}

export function ReleaseOverTimeConfig({ amount, tokenLabel }: Props) {
  const { values, setFieldValue } = useFormikContext<PaymentTermsValues>();

  const releases = estimatedReleaseCount(amount, values.chunkAmount);
  const chunkReadout =
    releases === null
      ? undefined
      : releases === 1
        ? `${values.chunkAmount} ${tokenLabel} in a single release`
        : `${values.chunkAmount} ${tokenLabel} each, about ${releases} releases`;

  return (
    <FieldStack>
      <ChoiceField
        name="releaseSchedule"
        label="How should it release?"
        options={[
          {
            value: "specificDate",
            label: "On a specific date",
            tag: "Coming soon",
            description: "Everything unlocks at once on the date you choose.",
          },
          {
            value: "recurring",
            label: "In recurring chunks",
            description:
              "A fixed amount becomes claimable each period until the escrow runs out.",
          },
          {
            value: "stream",
            label: "As a continuous stream",
            tag: "Coming soon",
            description:
              "Funds unlock second by second between a start and end date.",
          },
          {
            value: "milestones",
            label: "At milestones",
            tag: "Proposed",
            description:
              "Each tranche releases when its milestone is approved.",
          },
          {
            value: "customVesting",
            label: "Custom vesting",
            tag: "Coming soon",
            description: "Define your own unlock dates and amounts.",
          },
        ]}
      />

      {values.releaseSchedule === "specificDate" ? (
        <>
          <TermsDateField name="releaseDate" label="Release date" />
        </>
      ) : null}

      {values.releaseSchedule === "recurring" ? (
        <>
          <TermsTextField
            name="chunkAmount"
            label="Amount per release"
            inputMode="decimal"
            suffix={tokenLabel}
            readout={chunkReadout}
          />
          <ChoiceField
            name="chunkPeriodPreset"
            label="How often?"
            options={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "custom", label: "Custom" },
            ]}
          />
          {values.chunkPeriodPreset === "custom" ? <CustomFrequency /> : null}
          <ChoiceField
            name="unclaimedBehavior"
            label="If a chunk goes unclaimed"
            options={[
              {
                value: "return",
                label: "It returns to me after a date",
                description:
                  "Chunks not claimed in their period are forfeited. Whatever is left comes back to you after the date.",
              },
              {
                value: "stay",
                label: "It stays claimable",
                tag: "Coming soon",
                description:
                  "Unclaimed chunks accumulate and the recipient can take them later.",
              },
            ]}
          />
          {values.unclaimedBehavior === "return" ? (
            <TermsDateField
              name="returnAfterDate"
              label="Return unclaimed funds after"
              help="Local time. The recipient can keep claiming chunks until then."
            />
          ) : null}
        </>
      ) : null}

      {values.releaseSchedule === "stream" ? (
        <>
          <TermsDateField name="streamStart" label="Stream starts" />
          <TermsDateField name="streamEnd" label="Stream ends" />
        </>
      ) : null}

      {values.releaseSchedule === "milestones" ? (
        <PlaceholderEditor>
          Milestone rows (title, amount, due date, approver) are coming in the
          next iteration.
        </PlaceholderEditor>
      ) : null}

      {values.releaseSchedule === "customVesting" ? (
        <PlaceholderEditor>
          Tranche rows (unlock date and amount) are coming in the next
          iteration.
        </PlaceholderEditor>
      ) : null}
    </FieldStack>
  );
}
