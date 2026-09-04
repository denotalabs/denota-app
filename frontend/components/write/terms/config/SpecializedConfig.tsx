import { Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { formTheme } from "../../../designSystem/form/formTheme";
import { FieldStack } from "../fields/FieldChrome";
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
  customHook:
    "Bring your own hook contract. The rules it enforces are entirely up to that contract, so only use hooks you have reviewed.",
};

export function SpecializedConfig() {
  const { values } = useFormikContext<PaymentTermsValues>();
  if (!values.specialized) {
    return null;
  }

  return (
    <FieldStack>
      <Text fontSize="14px" lineHeight={1.55} color={formTheme.mutedLight}>
        {BLURBS[values.specialized]}
      </Text>
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
