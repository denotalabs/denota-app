import { Box } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import {
  CONDITION_TYPE_LABELS,
  CONDITION_TYPE_PHRASES,
  CONDITION_TYPES,
  NFT_COLLECTION_SPOOFING_NOTICE,
} from "../../../../utils/balanceOfConditionalCash";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import NftCollectionAddressField from "../../../fields/input/NftCollectionAddressField";
import { ChoiceField } from "../fields/ChoiceField";
import { FieldHelp, FieldLabel, FieldStack } from "../fields/FieldChrome";
import { TermsDateField } from "../fields/TermsDateField";
import { TermsTextField } from "../fields/TermsTextField";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function OwnershipFields() {
  return (
    <>
      <Box>
        <FieldLabel htmlFor="nftCollectionAddress">
          Token or NFT collection
        </FieldLabel>
        <NftCollectionAddressField fieldName="nftCollectionAddress" />
        <FieldHelp>{NFT_COLLECTION_SPOOFING_NOTICE}</FieldHelp>
      </Box>
      <ChoiceField
        name="conditionType"
        label="Required balance"
        options={CONDITION_TYPES.map((type) => ({
          value: type,
          label: capitalize(CONDITION_TYPE_PHRASES[type]),
        }))}
      />
      <TermsTextField
        name="nftBalanceThreshold"
        label="How many must they hold?"
        inputMode="numeric"
        help="Checked against the recipient's balance each time they try to claim."
      />
      <TermsDateField
        name="conditionExpiration"
        label="Condition expires"
        help="Local time. After this, the recipient can no longer claim and you can recover the funds."
      />
    </>
  );
}

function OnchainStateFields() {
  const { values } = useFormikContext<PaymentTermsValues>();
  const compareReturn = values.onchainUnlock === "returnValue";

  return (
    <>
      <TermsTextField
        name="onchainContract"
        label="Contract"
        placeholder="0x…"
        help="Contract called when the recipient tries to claim."
      />
      <TermsTextField
        name="onchainCalldata"
        label="Function call data"
        placeholder="0x…"
        help={
          compareReturn
            ? "Encoded call whose return value is compared."
            : "Encoded call that must succeed for the claim to go through."
        }
      />
      <ChoiceField
        name="onchainUnlock"
        label="The call unlocks when"
        options={[
          {
            value: "succeeds",
            label: "It succeeds",
            description:
              "If the call doesn't revert, the recipient can claim. Nothing about the return value is checked.",
          },
          {
            value: "returnValue",
            label: "The result matches",
            description:
              "The call must succeed and its return value must meet the rule you set.",
          },
        ]}
      />
      {compareReturn ? (
        <>
          <ChoiceField
            name="onchainCondition"
            label="Compare the result"
            options={CONDITION_TYPES.map((type) => ({
              value: type,
              label: CONDITION_TYPE_LABELS[type],
            }))}
          />
          <TermsTextField
            name="onchainExpected"
            label="To this value"
            placeholder="1"
            inputMode="numeric"
          />
        </>
      ) : null}
    </>
  );
}

export function ConditionConfig() {
  const { values } = useFormikContext<PaymentTermsValues>();

  return (
    <FieldStack>
      <ChoiceField
        name="conditionTrigger"
        label="What unlocks it?"
        options={[
          {
            value: "ownership",
            label: "Token or NFT ownership",
            description:
              "The recipient can claim while their balance in a collection meets your rule.",
          },
          {
            value: "price",
            label: "Asset price",
            tag: "Coming soon",
            description: "Release when an asset crosses a target price.",
          },
          {
            value: "onchainState",
            label: "Onchain contract state",
            tag: "Coming soon",
            description:
              "Release when a specified contract call succeeds, or when its return value meets a rule.",
          },
          {
            value: "attestation",
            label: "Attestation or proof",
            tag: "Coming soon",
            description:
              "Release when the recipient holds a valid credential or proof.",
          },
        ]}
      />

      {values.conditionTrigger === "ownership" ? <OwnershipFields /> : null}

      {values.conditionTrigger === "price" ? (
        <>
          <TermsTextField name="priceAsset" label="Asset" placeholder="ETH" />
          <ChoiceField
            name="priceDirection"
            label="Release when the price is"
            options={[
              { value: "above", label: "Above" },
              { value: "below", label: "Below" },
            ]}
          />
          <TermsTextField
            name="priceTarget"
            label="Target price"
            inputMode="decimal"
            placeholder="2000"
            suffix="USD"
          />
        </>
      ) : null}

      {values.conditionTrigger === "onchainState" ? (
        <OnchainStateFields />
      ) : null}

      {values.conditionTrigger === "attestation" ? (
        <ChoiceField
          name="attestationKind"
          label="Which kind?"
          options={[
            { value: "eas", label: "EAS attestation", tag: "Coming soon" },
            {
              value: "coinbaseKyc",
              label: "Coinbase verification",
              tag: "Coming soon",
            },
            { value: "hats", label: "Hats Protocol role", tag: "Coming soon" },
            { value: "zk", label: "Zero-knowledge proof", tag: "Experimental" },
          ]}
        />
      ) : null}
    </FieldStack>
  );
}
