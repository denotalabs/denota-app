import { Box, Collapse } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useState } from "react";
import {
  CONDITION_TYPE_PHRASES,
  CONDITION_TYPES,
  NFT_COLLECTION_SPOOFING_NOTICE,
} from "../../../../utils/balanceOfConditionalCash";
import type { PaymentTermsValues } from "../../../../utils/paymentTerms/types";
import { DisclosureToggle } from "../../../designSystem/form/DisclosureToggle";
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
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <DisclosureToggle
        label="Advanced: contract call"
        open={open}
        onToggle={() => setOpen((value) => !value)}
      />
      <Collapse in={open} animateOpacity>
        <Box pt={3}>
          <FieldStack>
            <TermsTextField
              name="onchainContract"
              label="Contract"
              placeholder="0x…"
              help="Contract whose state is read when the recipient tries to claim."
            />
            <TermsTextField
              name="onchainCalldata"
              label="Read function call data"
              placeholder="0x…"
              help="Encoded call whose return value is compared."
            />
            <TermsTextField
              name="onchainExpected"
              label="Expected result"
              placeholder="1"
            />
          </FieldStack>
        </Box>
      </Collapse>
    </Box>
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
              "Release when a contract read returns the value you expect.",
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
