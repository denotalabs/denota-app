import { Box, Button, Text } from "@chakra-ui/react";
import { useFormikContext } from "formik";
import { useCallback, useState } from "react";
import { useBlockchainData } from "../../../../context/BlockchainDataProvider";
import {
  PREVIEW_NOTA_ID,
  signGiftCardMessage,
} from "../../../../utils/paymentTerms/giftCardSignature";
import {
  giftSignSettingsApply,
  type PaymentTermsValues,
} from "../../../../utils/paymentTerms/types";
import { formTheme } from "../../../designSystem/form/formTheme";
import { ChoiceField } from "../fields/ChoiceField";
import { FieldHelp, FieldStack } from "../fields/FieldChrome";
import { TermsDateField } from "../fields/TermsDateField";
import { TermsTextField } from "../fields/TermsTextField";

interface Props {
  tokenLabel: string;
}

/**
 * Signs the note with the connected wallet and shows the resulting signature
 * read-only. This is the value the hook would recover a signer from; the real
 * nota id isn't known yet, so the preview signs `PREVIEW_NOTA_ID`.
 */
function GiftSignaturePreview() {
  const { values, setFieldValue } = useFormikContext<PaymentTermsValues>();
  const { blockchainState, connectWallet } = useBlockchainData();
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signer, registrarAddress } = blockchainState;
  const message = values.giftNote.trim();

  const sign = useCallback(async () => {
    if (!signer || !registrarAddress) {
      await connectWallet?.();
      return;
    }
    setIsSigning(true);
    setError(null);
    try {
      const signature = await signGiftCardMessage(
        signer,
        registrarAddress,
        PREVIEW_NOTA_ID,
        message
      );
      await setFieldValue("giftSignature", signature);
      setSignedMessage(message);
    } catch {
      setError("Signing was declined or failed. Try again.");
    } finally {
      setIsSigning(false);
    }
  }, [connectWallet, message, registrarAddress, setFieldValue, signer]);

  const isStale =
    Boolean(values.giftSignature) && signedMessage !== null && signedMessage !== message;

  return (
    <Box>
      <Button
        onClick={sign}
        isLoading={isSigning}
        type="button"
        bg="brand.300"
        color={formTheme.textDark}
        borderRadius="10px"
        minH="44px"
        w="100%"
        fontSize="14px"
        _hover={{ bg: "brand.200", color: "brand.100" }}
      >
        {!signer
          ? "Connect a wallet to sign"
          : values.giftSignature
            ? "Sign again"
            : "Sign with my wallet"}
      </Button>
      <Box mt={3}>
        <TermsTextField
          name="giftSignature"
          label="Signature"
          multiline
          rows={2}
          isReadOnly
          placeholder="Sign above to see the signature passed to the hook."
          help={
            message
              ? "Covers the registrar, the nota id, and your note above."
              : "With a blank note this signs the registrar and nota id only."
          }
        />
      </Box>
      {isStale ? (
        <FieldHelp>Your note changed. Sign again to refresh this.</FieldHelp>
      ) : null}
      {error ? (
        <Text mt={1.5} fontSize="13px" color={formTheme.error} role="alert">
          {error}
        </Text>
      ) : null}
    </Box>
  );
}

export function GiftCardConfig({ tokenLabel }: Props) {
  const { values } = useFormikContext<PaymentTermsValues>();
  const showSignSettings = giftSignSettingsApply(values.giftSignWho);

  return (
    <FieldStack>
      <TermsTextField
        name="giftName"
        label="Card name"
        placeholder="Happy birthday"
        help="Shown on the card. Leave blank to use a default name."
      />
      <TermsTextField
        name="giftNote"
        label="Your note"
        multiline
        placeholder="A message the holder will see."
        help="Stored on the card as its description. Others can add their own signed messages later."
      />
      <GiftSignaturePreview />

      {/* <ChoiceField
        name="giftFundWho"
        label="Who can add more funds?"
        options={[
          {
            value: "anyone",
            label: "Anyone",
            description:
              "Friends, family, or anyone else can top up the escrow.",
          },
          {
            value: "allowlist",
            label: "An allowlist",
            description: "Only the people you list can add funds.",
          },
        ]}
      /> */}
      {values.giftFundWho === "allowlist" ? (
        <TermsTextField
          name="giftFundAllowlist"
          label="Who can fund it?"
          multiline
          placeholder={"0x…\nname.eth"}
          help="One address, ENS name, email, or phone per line."
        />
      ) : null}

      <ChoiceField
        name="giftSignWho"
        label="Who else can leave a signed message?"
        options={[
          {
            value: "nobody",
            label: "Nobody",
            description:
              "No guest book. The card keeps the name and note you set.",
          },
          {
            value: "anyone",
            label: "Anyone",
            description:
              "Anyone can attach a signed note. It is stored on the card's metadata.",
          },
          {
            value: "onlyFunders",
            label: "Only funders",
            description:
              "Only people allowed to add funds can also leave a signed message.",
          },
          {
            value: "allowlist",
            label: "An allowlist",
            description:
              "Only the people you list can attach a signed message.",
          },
        ]}
      />
      {values.giftSignWho === "allowlist" ? (
        <TermsTextField
          name="giftSignAllowlist"
          label="Who can sign?"
          multiline
          placeholder={"0x…\nname.eth"}
          help="One address, ENS name, email, or phone per line."
        />
      ) : null}

      {showSignSettings ? (
        <ChoiceField
          name="giftSignCost"
          label="To leave a message they must"
          options={[
            {
              value: "free",
              label: "Just sign",
              description:
                "They sign from their wallet. No extra funds required.",
            },
            {
              value: "minEscrow",
              label: "Escrow a minimum",
              description:
                "They must add at least this much to the card to attach their note.",
            },
          ]}
        />
      ) : null}
      {showSignSettings && values.giftSignCost === "minEscrow" ? (
        <TermsTextField
          name="giftMinSignAmount"
          label="Minimum to attach a message"
          inputMode="decimal"
          suffix={tokenLabel}
          help="Dust top-ups below this amount cannot add a signed message."
        />
      ) : null}

      {showSignSettings ? (
        <ChoiceField
          name="giftMetadataControl"
          label="Who sets the name, image, and description?"
          options={[
            {
              value: "issuer",
              label: "You, at creation",
              description:
                "The look you set here stays, even as others fund or sign.",
            },
            {
              value: "highestFunder",
              label: "The highest funder",
              description:
                "Whoever has added the most can replace the name, image, and note.",
            },
            {
              value: "anyFunder",
              label: "Anyone who funds",
              description: "Each top-up can update the card's look.",
            },
          ]}
        />
      ) : null}

      <ChoiceField
        name="giftTransferable"
        label="Can the holder give it away?"
        layout="segments"
        options={[
          {
            value: "yes",
            label: "Yes",
            description: "Whoever holds the card can cash the escrow.",
          },
          {
            value: "afterCash",
            label: "Once cashed",
            description:
              "They can pass the card on only after the funds have been claimed.",
          },
          {
            value: "no",
            label: "No",
            description:
              "The card stays with the original recipient.",
          },
        ]}
      />

      <ChoiceField
        name="giftUnclaimed"
        label="If they never cash it"
        options={[
          {
            value: "stay",
            label: "It stays until they do",
            description: "The escrow waits. There is no expiry.",
          },
          {
            value: "return",
            label: "It returns to you after a date",
            description:
              "If the holder hasn't cashed by then, only you can recover the funds.",
          },
        ]}
      />
      {values.giftUnclaimed === "return" ? (
        <TermsDateField
          name="giftReturnDate"
          label="Return unclaimed funds after"
          help="Local time. After this moment the holder can no longer cash it."
        />
      ) : null}
    </FieldStack>
  );
}
