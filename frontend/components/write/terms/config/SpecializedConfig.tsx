import { Box, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { PEOPLE_ACCOUNT_PLACEHOLDER } from "../../../../utils/accountIdentifier";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { formTheme } from "../../../designSystem/form/formTheme";
import AccountField from "../../../fields/input/AccountField";
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
    "You cannot reverse immediately. After a lock period (half the time until the claim date) you can take the funds back, until that date. After it, only the recipient can claim.",
  customHook:
    "Bring your own hook contract. The rules it enforces are entirely up to that contract, so only use hooks you have reviewed.",
};

interface Props {
  amount: string | undefined;
  tokenLabel: string;
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
            allowPrivyIdentifier
            placeholder={PEOPLE_ACCOUNT_PLACEHOLDER}
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
        <TermsDateField
          name="inspectionEndDate"
          label="Recipient can claim after"
          help="Local time. You can reverse after the halfway point, until this moment. After it, only they can claim."
        />
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
