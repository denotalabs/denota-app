import { formatUnits } from "ethers/lib/utils";

import { truncateAddress } from "./address";
import {
  CONDITION_TYPE_PHRASES,
  ConditionType,
  NFT_COLLECTION_FALLBACK_LABEL,
  nftCountPhrase,
  traitLabelToConditionType,
} from "./balanceOfConditionalCash";
import { formatOnChainDripPeriod } from "./dripPeriod";
import { HookModuleName, hookModuleName } from "./notaActions/hookRegistry";
import { TRAIT } from "./notaActions/metadataTraits";
import {
  formatMetadataTimestamp,
  getMetadataAttribute,
  getMetadataDateAttribute,
  TokenMetadata,
} from "./notaTokenUri";

/** Roles the story can point at; they mirror the Participants list. */
export type AgreementRole = "payer" | "recipient" | "arbitrator";

export type AgreementSegment =
  | { kind: "text"; text: string }
  | { kind: "amount" }
  | { kind: "role"; role: AgreementRole; label: string };

export interface AgreementStoryInput {
  hookAddress: string | null;
  metadata: TokenMetadata | null;
  currencySymbol: string;
  currencyDecimals: number;
  /** True when nothing is escrowed, so the story cannot quote an amount. */
  isEmpty: boolean;
  ensNames?: Map<string, string | null>;
}

const PLACEHOLDER_PATTERN = /(\{amount\}|\{payer\}|\{recipient\}|\{arbitrator\})/;

function formatDate(date: Date | null): string | null {
  if (!date || date.getTime() === 0) {
    return null;
  }
  return formatMetadataTimestamp(date);
}

function formatCollection(
  address: string | null,
  ensNames: Map<string, string | null> | undefined
): string {
  if (!address) {
    return NFT_COLLECTION_FALLBACK_LABEL;
  }
  return ensNames?.get(address.toLowerCase()) ?? truncateAddress(address);
}

/** Drip amounts are stored in token units, so they need the currency decimals. */
function formatTokenAmount(
  raw: string | null,
  decimals: number
): string | null {
  if (!raw?.trim()) {
    return null;
  }
  try {
    return formatUnits(raw.trim(), decimals);
  } catch {
    return null;
  }
}

function conditionsForModule(
  module: HookModuleName,
  input: AgreementStoryInput
): string {
  const { metadata, currencySymbol, currencyDecimals, ensNames } = input;

  switch (module) {
    case "simpleCash":
      return "{recipient} may claim the full amount at any time. There is no deadline and no arbitrator, and {payer} cannot pull the funds back.";

    case "cashBeforeDate": {
      const deadline = formatDate(
        getMetadataDateAttribute(metadata, TRAIT.expirationDate)
      );
      if (!deadline) {
        return "{recipient} must claim before the expiration date recorded on-chain. Once it passes, only {payer} can recover the escrow.";
      }
      return `{recipient} must claim before ${deadline}. Once that passes, {recipient} can no longer claim and only {payer} can recover the escrow.`;
    }

    case "reversibleRelease":
      return "{arbitrator} decides the outcome and may release the escrow to {recipient} or reverse it to {payer} at any time. {recipient} cannot claim it on their own.";

    case "reversibleByBeforeDate": {
      const inspectionEnd = formatDate(
        getMetadataDateAttribute(metadata, TRAIT.inspectionEnd)
      );
      if (!inspectionEnd) {
        return "{arbitrator} may release the escrow to {recipient} or reverse it to {payer} until the inspection period ends. After that, only {recipient} can claim it.";
      }
      return `Until ${inspectionEnd}, {arbitrator} may release the escrow to {recipient} or reverse it to {payer}. After that it can no longer be reversed and {recipient} can claim it.`;
    }

    case "cashBeforeDateDrip": {
      const deadline = formatDate(
        getMetadataDateAttribute(metadata, TRAIT.expirationDate)
      );
      const dripAmount = formatTokenAmount(
        getMetadataAttribute(metadata, TRAIT.dripAmount),
        currencyDecimals
      );
      const dripPeriod = getMetadataAttribute(metadata, TRAIT.dripPeriod)?.trim();
      const allowance =
        dripAmount && dripPeriod
          ? `up to ${dripAmount} ${currencySymbol} every ${formatOnChainDripPeriod(dripPeriod)}`
          : "a fixed amount once per drip period";
      const untilClause = deadline ? ` until ${deadline}` : "";
      const recovery = deadline
        ? "After that date, {payer} can recover whatever is left."
        : "After the expiration date, {payer} can recover whatever is left.";
      return `{recipient} may claim ${allowance}${untilClause}. Anything not claimed within a period is forfeited. ${recovery}`;
    }

    case "balanceOfConditionalCash": {
      const collection = formatCollection(
        getMetadataAttribute(metadata, TRAIT.nftAddress),
        ensNames
      );
      const threshold = getMetadataAttribute(metadata, TRAIT.thresholdNumber) ?? "1";
      const conditionType =
        traitLabelToConditionType(
          getMetadataAttribute(metadata, TRAIT.conditionType)
        ) ?? ("GTEQ" as ConditionType);
      const comparison = CONDITION_TYPE_PHRASES[conditionType];
      const deadline = formatDate(
        getMetadataDateAttribute(metadata, TRAIT.expirationDate)
      );
      const recovery = deadline
        ? `After ${deadline}, {recipient} loses the right to claim and {payer} can recover the escrow.`
        : "After the expiration date, {recipient} loses the right to claim and {payer} can recover the escrow.";
      return `{recipient} can only claim while they hold ${comparison} ${nftCountPhrase(threshold)} from ${collection}. The balance is checked on-chain at the moment of the claim. ${recovery}`;
    }

    default:
      return "";
  }
}

/**
 * Prose describing what this nota's hook actually enforces, as segments so the
 * caller can style amounts and participant roles.
 */
export function buildAgreementStory(
  input: AgreementStoryInput
): AgreementSegment[] {
  const module = input.hookAddress ? hookModuleName(input.hookAddress) : null;

  if (module === "directSend") {
    return toSegments(
      "This payment was sent straight to {recipient} when it was written. Nothing is held in escrow, so there is nothing left to release or reverse."
    );
  }

  const lead = input.isEmpty
    ? "Funds sent to this payment are held in escrow for {recipient}."
    : "{amount} is held in escrow for {recipient}.";

  const conditions = module
    ? conditionsForModule(module, input)
    : input.hookAddress
      ? "Release is governed by a hook contract this app does not recognize. Read its code before acting on the escrow."
      : "Release is governed by this payment's hook contract.";

  return toSegments(`${lead} ${conditions}`);
}

const ROLE_FOR_PLACEHOLDER: Record<string, AgreementRole> = {
  "{payer}": "payer",
  "{recipient}": "recipient",
  "{arbitrator}": "arbitrator",
};

function toSegments(template: string): AgreementSegment[] {
  const parts = template.split(PLACEHOLDER_PATTERN).filter((part) => part !== "");

  return parts.map((part, index): AgreementSegment => {
    if (part === "{amount}") {
      return { kind: "amount" };
    }

    const role = ROLE_FOR_PLACEHOLDER[part];
    if (!role) {
      return { kind: "text", text: part };
    }

    const preceding = index === 0 ? "" : parts[index - 1].trimEnd();
    const startsSentence = preceding === "" || /[.!?]$/.test(preceding);
    return {
      kind: "role",
      role,
      label: startsSentence ? `The ${role}` : `the ${role}`,
    };
  });
}
