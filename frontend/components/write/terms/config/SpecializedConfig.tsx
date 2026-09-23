import { Box, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import {
  formatConfirmDate,
  formatDateTimeLocal,
} from "../../../../utils/expirationDate";
import { lockUnlockMs } from "../../../../utils/paymentTerms/summary";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { formTheme } from "../../../designSystem/form/formTheme";
import AccountField from "../../../fields/input/AccountField";
import { ChoiceField } from "../fields/ChoiceField";
import { FieldHelp, FieldLabel, FieldStack } from "../fields/FieldChrome";
import { TermsDateField } from "../fields/TermsDateField";
import { TermsTextField } from "../fields/TermsTextField";

const BLURBS: Record<Exclude<PaymentTermsValues["specialized"], "">, string> = {
  bills:
    "The payment is issued as a bill the holder can transfer to someone else or redeem when it matures.",
  compliance:
    "Transfers and claims are checked against an allowlist, so funds only move between approved addresses.",
  probabilistic:
    "Instead of a fixed amount, the payment pays out with a set probability.",
  onchainChat:
    "The payment is attached to an onchain message thread shared with the recipient.",
  timelockPromise:
    "Their pay is locked until a date you choose. The rest is your deposit: it comes back to you after that date unless you approve it for them.",
  forwarderReverser:
    "You can release the escrow to the recipient at any time. A person you name can send it back to you instead.",
  reversibleBeforeDelayable:
    "You can take the funds back until a date. Sending more of the payment token later pushes that date out, at the daily cost you set.",
  reversibleStartsLocked:
    "You cannot reverse immediately. After a lock period (a share of the time until the claim date) you can take the funds back, until that date. After it, only the recipient can claim.",
  reviewerDecreasing:
    "Nothing moves unless the reviewer releases it. They can release the full amount from the start. After a date, they release the set amount plus whatever reverse-linear extra is still left.",
  customHook:
    "Bring your own hook contract. The rules it enforces are entirely up to that contract, so only use hooks you have reviewed.",
};

interface Props {
  amount: string | undefined;
  tokenLabel: string;
}

function StartsLockedFields() {
  const { values } = useFormikContext<PaymentTermsValues>();
  const unlockMs = lockUnlockMs(
    values.inspectionEndDate,
    values.lockPeriodPercent
  );
  const unlockReadout =
    unlockMs === null
      ? undefined
      : `You can reverse starting ${formatConfirmDate(
        formatDateTimeLocal(new Date(unlockMs))
      )}`;

  return (
    <>
      <TermsDateField
        name="inspectionEndDate"
        label="Recipient can claim after"
        help="Local time. After this moment only they can claim. You can reverse once the lock period ends, until then."
      />
      <TermsTextField
        name="lockPeriodPercent"
        label="Lock period"
        inputMode="decimal"
        suffix="%"
        tooltip="Share of the time until they can claim that stays locked. 50% means you wait halfway, then you can reverse until that date."
        readout={unlockReadout}
        help="Share of the time until they can claim that stays locked. 50% means you wait halfway."
      />
    </>
  );
}

export function SpecializedConfig({ amount, tokenLabel }: Props) {
  const { values } = useFormikContext<PaymentTermsValues>();
  if (!values.specialized) {
    return null;
  }

  const total = Number(amount);
  const firstHalf = Number(values.firstHalfAmount);
  const deposit =
    Number.isFinite(total) && total > 0 && Number.isFinite(firstHalf)
      ? total - firstHalf
      : null;
  const depositReadout =
    deposit !== null && deposit >= 0
      ? `Your deposit: ${deposit} ${tokenLabel}`.trim()
      : undefined;
  const floor = Number(values.reviewerFloorAmount);
  const remainder =
    Number.isFinite(total) && total > 0 && Number.isFinite(floor)
      ? total - floor
      : null;
  const remainderReadout =
    remainder !== null && remainder > 0
      ? `Remaining ${remainder} ${tokenLabel} shrinks back to you`
      : undefined;

  return (
    <FieldStack>
      <Text fontSize="14px" lineHeight={1.55} color={formTheme.mutedLight}>
        {BLURBS[values.specialized]}
      </Text>

      {values.specialized === "timelockPromise" ? (
        <>
          <TermsTextField
            name="firstHalfAmount"
            label="Recipient's locked pay"
            inputMode="decimal"
            suffix={tokenLabel}
            readout={depositReadout}
          />
          <TermsDateField
            name="releaseDate"
            label="Unlock date"
            help="Local time. Their pay unlocks then. If you never approved the deposit, you can reclaim it from this moment."
          />
        </>
      ) : null}

      {values.specialized === "forwarderReverser" ? (
        <Box>
          <FieldLabel htmlFor="reverserAddress">Who can reverse it?</FieldLabel>
          <AccountField
            fieldName="reverserAddress"
            resolvedFieldName="resolvedReverserAddress"
            allowEns
            useFieldValidate={false}
            placeholder="Email, phone, name.eth, or 0x…"
          />
          <FieldHelp>
            This person can send the escrow back to you. You still release it to
            the recipient yourself.
          </FieldHelp>
        </Box>
      ) : null}

      {values.specialized === "reversibleBeforeDelayable" ? (
        <>
          <TermsDateField
            name="inspectionEndDate"
            label="Refund window ends"
            help="Local time. After this moment only the recipient can receive the funds, unless you extend it."
          />
          <TermsTextField
            name="delayCostPerDay"
            label="Cost to extend by one day"
            inputMode="decimal"
            suffix={tokenLabel}
            help="Later, sending this much of the payment token pushes the refund deadline out by one day."
          />
        </>
      ) : null}

      {values.specialized === "reversibleStartsLocked" ? (
        <StartsLockedFields />
      ) : null}

      {values.specialized === "reviewerDecreasing" ? (
        <>
          <ChoiceField
            name="reviewer"
            label="Who is the reviewer?"
            options={[
              {
                value: "me",
                label: "Me",
                description:
                  "You release to the recipient, or take the decayed remainder, from your connected wallet. You can release the full amount from the start.",
              },
              {
                value: "other",
                label: "A reviewer",
                description:
                  "A third party you trust releases to the recipient. You still take the decayed remainder. They can release the full amount from the start.",
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
                useFieldValidate={false}
                placeholder="Email, phone, name.eth, or 0x…"
              />
              <FieldHelp>
                This person can release the remaining amount to the recipient.
                Double-check the address.
              </FieldHelp>
            </Box>
          ) : null}
          <TermsTextField
            name="reviewerFloorAmount"
            label="Set amount"
            inputMode="decimal"
            suffix={tokenLabel}
            readout={remainderReadout}
          />
          <TermsDateField
            name="decreaseStart"
            label="Reverse linear starts decaying"
            help="Until this date the reviewer can release the full escrow. After it, they can still release the set amount plus whatever reverse-linear extra is left."
          />
          <TermsDateField
            name="decreaseEnd"
            label="Only the set amount is left"
            help="Local time. After this moment the reviewer can still release the set amount, and you can take the reverse-linear remainder."
          />
        </>
      ) : null}

      {values.specialized === "customHook" ? (
        <TermsTextField
          name="customHookAddress"
          label="Hook contract address"
          placeholder="0x…"
          help="The registrar will call this contract on every write, transfer, fund, and cash."
        />
      ) : null}
    </FieldStack>
  );
}
