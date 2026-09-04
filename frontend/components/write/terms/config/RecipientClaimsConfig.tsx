import { useFormikContext } from "formik";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { ChoiceField } from "../fields/ChoiceField";
import { FieldStack } from "../fields/FieldChrome";
import { TermsDateField } from "../fields/TermsDateField";

export function RecipientClaimsConfig() {
  const { values } = useFormikContext<PaymentTermsValues>();

  return (
    <FieldStack>
      <ChoiceField
        name="claimWhen"
        label="When can they claim it?"
        options={[
          {
            value: "anytime",
            label: "Anytime",
            description:
              "No deadline. The funds wait until the recipient claims them.",
          },
          {
            value: "beforeDeadline",
            label: "Before a deadline",
            description:
              "If they haven't claimed by the deadline, only you can recover the funds.",
          },
        ]}
      />

      {values.claimWhen === "beforeDeadline" ? (
        <TermsDateField
          name="claimDeadline"
          label="Claim deadline"
          help="Local time. After this moment the recipient can no longer claim."
        />
      ) : null}

      <ChoiceField
        name="claimDestination"
        label="Where can the funds go?"
        options={[
          {
            value: "recipient",
            label: "Their wallet only",
            description: "Claims always land in the recipient's own wallet.",
          },
          {
            value: "anyAddress",
            label: "Any address they pick",
            tag: "Coming soon",
            description:
              "The recipient can direct the funds to another address when they claim.",
          },
        ]}
      />
    </FieldStack>
  );
}
