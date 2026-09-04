import { Box } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import AccountField from "../../../fields/input/AccountField";
import { ChoiceField } from "../fields/ChoiceField";
import { FieldHelp, FieldLabel, FieldStack } from "../fields/FieldChrome";
import { TermsDateField } from "../fields/TermsDateField";
import { TermsTextField } from "../fields/TermsTextField";

export function ReviewerConfig() {
  const { values } = useFormikContext<PaymentTermsValues>();
  const singleReviewer =
    values.reviewer === "me" || values.reviewer === "other";

  return (
    <FieldStack>
      <ChoiceField
        name="reviewer"
        label="Who decides?"
        options={[
          {
            value: "me",
            label: "Me",
            description:
              "You release the funds to the recipient, or take them back, from your connected wallet.",
          },
          {
            value: "other",
            label: "Another reviewer",
            description:
              "A third party you trust can release the funds to the recipient or refund them to you.",
          },
          {
            value: "group",
            label: "A group",
            tag: "Coming soon",
            description: "Several signers must agree before funds move.",
          },
          {
            value: "arbitration",
            label: "Arbitration",
            tag: "Coming soon",
            description:
              "A neutral arbitration service settles disputes over the funds.",
          },
        ]}
      />

      {values.reviewer === "other" ? (
        <Box>
          <FieldLabel htmlFor="reviewerAddress">Reviewer</FieldLabel>
          <AccountField
            fieldName="reviewerAddress"
            resolvedFieldName="resolvedReviewerAddress"
            allowEns
            placeholder="almaraz.eth or 0x…"
          />
          <FieldHelp>
            This person can move the escrowed funds. Double-check the address.
          </FieldHelp>
        </Box>
      ) : null}

      {values.reviewer === "group" ? (
        <>
          <TermsTextField
            name="groupSigners"
            label="Signers"
            multiline
            placeholder={"0x…\n0x…\nname.eth"}
            help="One address or ENS name per line."
          />
          <TermsTextField
            name="groupThreshold"
            label="Approvals needed"
            inputMode="numeric"
            help="How many of the signers must agree before funds move."
          />
        </>
      ) : null}

      {values.reviewer === "arbitration" ? (
        <ChoiceField
          name="arbitrationProvider"
          label="Provider"
          options={[
            {
              value: "kleros",
              label: "Kleros",
              tag: "Coming soon",
              description:
                "Staked jurors review evidence and vote; the result is enforced onchain.",
            },
            {
              value: "ai",
              label: "AI arbitrator",
              tag: "Experimental",
              description:
                "A model reviews the evidence and returns a verdict through a verifiable pipeline.",
            },
            {
              value: "privateVoting",
              label: "Private voting",
              tag: "Experimental",
              description:
                "A group decides by encrypted ballot; only the aggregate result is revealed.",
            },
          ]}
        />
      ) : null}

      {singleReviewer ? (
        <ChoiceField
          name="refundWindow"
          label="How long can they refund?"
          options={[
            {
              value: "untilDecide",
              label: "Until they decide",
              description:
                "The funds stay in escrow until the reviewer releases or refunds them.",
            },
            {
              value: "untilDate",
              label: "Until a specific date",
              description:
                "After the date, the reviewer loses that power and the recipient can claim.",
            },
          ]}
        />
      ) : null}

      {singleReviewer && values.refundWindow === "untilDate" ? (
        <TermsDateField
          name="inspectionEndDate"
          label="Refund window ends"
          help="Local time. After this moment only the recipient can receive the funds."
        />
      ) : null}
    </FieldStack>
  );
}
