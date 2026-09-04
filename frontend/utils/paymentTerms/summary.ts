import { isAddress } from "ethers/lib/utils";
import { truncateAddress } from "../address";
import {
  CONDITION_TYPE_LABELS,
  CONDITION_TYPE_PHRASES,
  NFT_COLLECTION_FALLBACK_LABEL,
  nftCountPhrase,
} from "../balanceOfConditionalCash";
import { DripPeriodUnit } from "../dripPeriod";
import { expirationDateToCashBeforeDateMs } from "../expirationDate";
import type { PaymentTermsValues } from "./types";

export interface TermsSummaryContext {
  /** Human amount from the Basic information step, e.g. "500". */
  amount: string | undefined;
  /** Token label, e.g. "USDC". */
  tokenLabel: string;
  /** Optional ENS lookups for addresses mentioned in the sentence. */
  ensNames?: Map<string, string | null>;
}

/** Short absolute date for prose: "Sep 30, 2026, 11:59 PM". */
export function formatSummaryDate(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return "the chosen date";
  }
  const ms = expirationDateToCashBeforeDateMs(trimmed);
  if (!Number.isFinite(ms)) {
    return "the chosen date";
  }
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const UNIT_WORDS: Record<DripPeriodUnit, [string, string]> = {
  seconds: ["second", "seconds"],
  minutes: ["minute", "minutes"],
  hours: ["hour", "hours"],
  days: ["day", "days"],
  weeks: ["week", "weeks"],
};

/** "each week" / "each day" / "every 2 hours". */
export function chunkPeriodPhrase(values: PaymentTermsValues): string {
  switch (values.chunkPeriodPreset) {
    case "daily":
      return "each day";
    case "weekly":
      return "each week";
    case "monthly":
      return "each month";
    case "custom": {
      const n = Number(values.chunkPeriodAmount) || 0;
      const [one, many] = UNIT_WORDS[values.chunkPeriodUnit];
      if (n <= 0) {
        return "on a schedule";
      }
      return n === 1 ? `every ${one}` : `every ${n} ${many}`;
    }
  }
}

/** Number of releases needed to pay out the escrow at the chunk size. */
export function estimatedReleaseCount(
  totalAmount: string | undefined,
  chunkAmount: string
): number | null {
  const total = Number(totalAmount);
  const chunk = Number(chunkAmount);
  if (!(total > 0) || !(chunk > 0)) {
    return null;
  }
  return Math.ceil(total / chunk);
}

/** ENS name if known, the typed ENS name, or a truncated address. */
function reviewerLabel(
  values: PaymentTermsValues,
  ensNames?: Map<string, string | null>
): string {
  const input = values.reviewerAddress.trim();
  const resolved = values.resolvedReviewerAddress.trim();
  const address = isAddress(resolved)
    ? resolved
    : isAddress(input)
    ? input
    : "";
  if (!address) {
    return input || "the reviewer";
  }
  return (
    ensNames?.get(address.toLowerCase()) ??
    (isAddress(input) ? truncateAddress(address) : input)
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The plain-language summary shown on Confirm. This is a contract preview:
 * each sentence must match what the resolved hook enforces. The reviewer
 * wording ("refund it to you") is deliberate.
 */
export function buildTermsSummary(
  values: PaymentTermsValues,
  ctx: TermsSummaryContext
): string {
  const money = `${ctx.amount?.trim() || "0"} ${ctx.tokenLabel}`.trim();

  if (values.specialized) {
    switch (values.specialized) {
      case "bills":
        return `${money} is issued as a transferable bill the holder can redeem.`;
      case "compliance":
        return `${money} can only move between allowlisted, compliance-checked addresses.`;
      case "probabilistic":
        return `${money} pays out with a set probability instead of a fixed amount.`;
      case "onchainChat":
        return `${money} is attached to an onchain message thread with the recipient.`;
      case "customHook":
        return `${money} is governed by the custom hook you pasted. Review its rules carefully.`;
    }
  }

  switch (values.term) {
    case "":
      return "";

    case "recipientClaims": {
      const until =
        values.claimWhen === "beforeDeadline"
          ? ` until ${formatSummaryDate(values.claimDeadline)}`
          : "";
      if (values.claimDestination === "anyAddress") {
        return `The recipient can send ${money} to any address they choose${until}.`;
      }
      if (values.claimWhen === "beforeDeadline") {
        return `The recipient can claim ${money}${until}. After that, only you can recover it.`;
      }
      return `The recipient can claim ${money} at any time.`;
    }

    case "someoneReviews": {
      const held = `${money} is held for the recipient.`;
      switch (values.reviewer) {
        case "me":
          return values.refundWindow === "untilDate"
            ? `${held} You can release it to them or refund it to yourself until ${formatSummaryDate(
                values.inspectionEndDate
              )}. After that, the recipient can claim it.`
            : `${held} You can release it to them or refund it to yourself at any time.`;
        case "other": {
          const who = capitalize(reviewerLabel(values, ctx.ensNames));
          return values.refundWindow === "untilDate"
            ? `${held} ${who} can release it to them or refund it to you until ${formatSummaryDate(
                values.inspectionEndDate
              )}. After that, the recipient can claim it.`
            : `${held} ${who} can release it to them or refund it to you at any time.`;
        }
        case "group": {
          const signers = values.groupSigners
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean).length;
          const threshold = Number(values.groupThreshold) || 0;
          const of =
            signers > 0 ? `${threshold} of ${signers}` : `${threshold}`;
          return `${held} ${of} signers must agree to release it to them or refund it to you.`;
        }
        case "arbitration": {
          const provider =
            values.arbitrationProvider === "kleros"
              ? "Kleros jurors"
              : values.arbitrationProvider === "ai"
              ? "an AI arbitrator"
              : "a private vote";
          return `${held} If either of you disputes it, ${provider} decide whether to release it to them or refund it to you.`;
        }
      }
      return held;
    }

    case "releaseOverTime": {
      switch (values.releaseSchedule) {
        case "specificDate": {
          const base = `The recipient can claim ${money} on ${formatSummaryDate(
            values.releaseDate
          )}.`;
          return values.allowEarlyRelease
            ? `${base} You can release it early.`
            : base;
        }
        case "recurring": {
          const chunk = `${values.chunkAmount.trim() || "0"} ${ctx.tokenLabel}`;
          const count = estimatedReleaseCount(ctx.amount, values.chunkAmount);
          const about =
            count === null
              ? ""
              : count === 1
              ? ", a single release"
              : `, about ${count} releases`;
          const lead = `The recipient can claim ${chunk} ${chunkPeriodPhrase(
            values
          )}${about}, starting when you send it.`;
          if (values.unclaimedBehavior === "stay") {
            return `${lead} Unclaimed chunks stay claimable.`;
          }
          return `${lead} Chunks not claimed in their period are forfeited, and whatever remains returns to you after ${formatSummaryDate(
            values.returnAfterDate
          )}.`;
        }
        case "stream":
          return `${money} streams to the recipient continuously from ${formatSummaryDate(
            values.streamStart
          )} to ${formatSummaryDate(values.streamEnd)}.`;
        case "milestones":
          return `${money} is released to the recipient milestone by milestone as each one is approved.`;
        case "customVesting":
          return `${money} vests to the recipient on the custom schedule you define.`;
      }
      return "";
    }

    case "conditionMet": {
      switch (values.conditionTrigger) {
        case "ownership": {
          const comparison =
            CONDITION_TYPE_PHRASES[values.conditionType] ?? "at least";
          const count = nftCountPhrase(
            values.nftBalanceThreshold.trim() || "1"
          );
          const address = values.nftCollectionAddress.trim();
          const collection = isAddress(address)
            ? ctx.ensNames?.get(address.toLowerCase()) ??
              truncateAddress(address)
            : NFT_COLLECTION_FALLBACK_LABEL;
          return `The recipient can claim ${money} while holding ${comparison} ${count} from ${collection}. After ${formatSummaryDate(
            values.conditionExpiration
          )}, only you can recover it.`;
        }
        case "price": {
          const asset = values.priceAsset.trim() || "the asset";
          const target = values.priceTarget.trim() || "the target price";
          return `The recipient can claim ${money} once ${asset} is ${values.priceDirection} ${target}.`;
        }
        case "onchainState": {
          if (values.onchainUnlock !== "returnValue") {
            return `The recipient can claim ${money} once a specified contract call succeeds.`;
          }
          const comparison = (
            CONDITION_TYPE_LABELS[values.onchainCondition] ?? "Equal to"
          ).toLowerCase();
          const expected = values.onchainExpected.trim() || "the expected value";
          return `The recipient can claim ${money} once the contract read is ${comparison} ${expected}.`;
        }
        case "attestation": {
          const kind =
            values.attestationKind === "eas"
              ? "EAS attestation"
              : values.attestationKind === "coinbaseKyc"
              ? "Coinbase verification"
              : values.attestationKind === "hats"
              ? "Hats Protocol role"
              : "zero-knowledge proof";
          return `The recipient can claim ${money} once they hold a valid ${kind}.`;
        }
      }
      return "";
    }

    case "payMultiple": {
      switch (values.distribution) {
        case "fixedSplit":
          return `${money} is split among the recipients in the fixed amounts you set.`;
        case "inOrder":
          return `${money} pays the recipients in order, each receiving their full share before the next.`;
        case "sharedPot":
          switch (values.sharedPotKind) {
            case "fundraiser":
              return `${money} seeds a shared pot that others can contribute to.`;
            case "rotatingSavings":
              return `${money} joins a rotating savings pool paid out to members in turn.`;
            case "roundRobin":
              return `${money} is paid out to members in round-robin order.`;
          }
      }
      return "";
    }
  }
  return "";
}
