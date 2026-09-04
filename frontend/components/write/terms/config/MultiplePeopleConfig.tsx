import { useFormikContext } from "formik";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { ChoiceField } from "../fields/ChoiceField";
import { FieldStack } from "../fields/FieldChrome";
import { PlaceholderEditor } from "../fields/PlaceholderEditor";

interface Props {
  amount: string | undefined;
  tokenLabel: string;
}

export function MultiplePeopleConfig({ amount, tokenLabel }: Props) {
  const { values } = useFormikContext<PaymentTermsValues>();
  const total = `${amount?.trim() || "0"} ${tokenLabel}`;

  return (
    <FieldStack>
      <ChoiceField
        name="distribution"
        label="How should it be distributed?"
        options={[
          {
            value: "fixedSplit",
            label: "Fixed split",
            tag: "Coming soon",
            description: `Each recipient gets a set amount. Allocations must total ${total}.`,
          },
          {
            value: "inOrder",
            label: "Pay recipients in order",
            tag: "Coming soon",
            description:
              "The first recipient is paid in full before anything reaches the next.",
          },
          {
            value: "sharedPot",
            label: "Shared pot",
            tag: "Coming soon",
            description: "Several people fund or draw from one pool.",
          },
        ]}
      />

      {values.distribution === "fixedSplit" ? (
        <PlaceholderEditor>
          {`Recipient rows (address and amount) are coming in the next iteration. Allocations will need to total ${total}.`}
        </PlaceholderEditor>
      ) : null}

      {values.distribution === "sharedPot" ? (
        <ChoiceField
          name="sharedPotKind"
          label="What kind of pot?"
          options={[
            {
              value: "fundraiser",
              label: "Fundraiser",
              description: "Others contribute toward a goal or deadline.",
            },
            {
              value: "rotatingSavings",
              label: "Rotating savings",
              description:
                "Members pay in regularly and take turns receiving the pot.",
            },
            {
              value: "roundRobin",
              label: "Round-robin",
              description: "The pot is paid out to members one after another.",
            },
          ]}
        />
      ) : null}
    </FieldStack>
  );
}
