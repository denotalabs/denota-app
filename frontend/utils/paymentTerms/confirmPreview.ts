import { isAddress } from "ethers/lib/utils";
import { classifyAccountInput } from "../accountIdentifier";
import { truncateAddress } from "../address";
import { isEnsName } from "../ensAddress";
import {
  CONDITION_TYPE_LABELS,
  CONDITION_TYPE_PHRASES,
  NFT_COLLECTION_FALLBACK_LABEL,
  nftCountPhrase,
  type ConditionType,
} from "../balanceOfConditionalCash";
import { resolveDripPeriodSeconds } from "../dripPeriod";
import { formatConfirmDate } from "../expirationDate";
import { chunkPeriodPhrase, estimatedReleaseCount } from "./summary";
import type { PaymentTermsValues } from "./types";

export type NarrativeSegment =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string };

export interface ConfirmDetailRow {
  label: string;
  value: string;
  hint?: string;
  href?: string;
  showLock?: boolean;
}

export interface ConfirmPreview {
  narrative: NarrativeSegment[];
  sharedRows: ConfirmDetailRow[];
  termRows: ConfirmDetailRow[];
  legend: string | null;
}

export interface ConfirmPreviewContext {
  recipientLabel: string;
  amount: string | undefined;
  tokenLabel: string;
  documentUrl?: string;
  documentLabel?: string;
  imageUrl?: string;
  imageLabel?: string;
  ensNames?: Map<string, string | null>;
}

/** ENS name, email, or phone if typed; otherwise reverse-resolved ENS or a truncated address. */
export function resolvePartyLabel(
  typed: string,
  resolved: string | undefined,
  ensNames?: Map<string, string | null>,
  fallback = ""
): string {
  const input = typed.trim();
  if (isEnsName(input)) {
    return input.toLowerCase();
  }
  const contact = classifyAccountInput(input).contact;
  if (contact) {
    return contact.value;
  }
  const address = isAddress(resolved ?? "")
    ? (resolved as string)
    : isAddress(input)
      ? input
      : "";
  if (!address) {
    return input || fallback;
  }
  return ensNames?.get(address.toLowerCase()) ?? truncateAddress(address);
}

export function formatFundingAmount(
  amount: string | undefined,
  tokenLabel: string
): string {
  const trimmed = (amount ?? "").trim();
  const n = Number(trimmed);
  const qty =
    trimmed && Number.isFinite(n)
      ? n.toLocaleString(undefined, { maximumFractionDigits: 8 })
      : trimmed || "0";
  return `${qty} ${tokenLabel}`.trim();
}

function toNarrative(
  recipient: string,
  before: string,
  after: string
): NarrativeSegment[] {
  return [
    { kind: "text", text: before },
    { kind: "bold", text: recipient },
    { kind: "text", text: after },
  ];
}

function durationHint(totalSeconds: number): string | undefined {
  if (!(totalSeconds > 0)) {
    return undefined;
  }
  const months = totalSeconds / 2592000;
  const weeks = totalSeconds / 604800;
  const days = totalSeconds / 86400;
  const hours = totalSeconds / 3600;
  if (months >= 1.5) {
    const n = Math.round(months);
    return `~${n} ${n === 1 ? "month" : "months"} to fully vest`;
  }
  if (weeks >= 1.5) {
    const n = Math.round(weeks);
    return `~${n} ${n === 1 ? "week" : "weeks"} to fully vest`;
  }
  if (days >= 1) {
    const n = Math.round(days);
    return `~${n} ${n === 1 ? "day" : "days"} to fully vest`;
  }
  const n = Math.max(1, Math.round(hours));
  return `~${n} ${n === 1 ? "hour" : "hours"} to fully vest`;
}

function dripDurationHint(
  values: PaymentTermsValues,
  totalAmount: string | undefined
): string | undefined {
  const count = estimatedReleaseCount(totalAmount, values.chunkAmount);
  // First chunk is available immediately; remaining chunks are one period apart.
  if (count === null || count <= 1) {
    return undefined;
  }
  const periodSeconds = resolveDripPeriodSeconds({
    dripPeriodPreset: values.chunkPeriodPreset,
    dripPeriodAmount: values.chunkPeriodAmount,
    dripPeriodUnit: values.chunkPeriodUnit,
  });
  return durationHint((count - 1) * periodSeconds);
}

function reviewerValue(
  values: PaymentTermsValues,
  ensNames?: Map<string, string | null>
): string {
  if (values.reviewer === "me") {
    return "You";
  }
  if (values.reviewer === "group") {
    const signers = values.groupSigners
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean).length;
    const threshold = Number(values.groupThreshold) || 0;
    return signers > 0
      ? `${threshold} of ${signers} signers`
      : `${threshold} signers`;
  }
  if (values.reviewer === "arbitration") {
    if (values.arbitrationProvider === "kleros") {
      return "Kleros";
    }
    if (values.arbitrationProvider === "ai") {
      return "AI arbitrator";
    }
    return "Private vote";
  }
  return resolvePartyLabel(
    values.reviewerAddress,
    values.resolvedReviewerAddress,
    ensNames,
    "Reviewer"
  );
}

function collectionLabel(
  address: string,
  ensNames?: Map<string, string | null>
): string {
  const trimmed = address.trim();
  if (!isAddress(trimmed)) {
    return trimmed || NFT_COLLECTION_FALLBACK_LABEL;
  }
  return ensNames?.get(trimmed.toLowerCase()) ?? truncateAddress(trimmed);
}

function sharedRows(ctx: ConfirmPreviewContext): ConfirmDetailRow[] {
  const rows: ConfirmDetailRow[] = [
    { label: "Recipient", value: ctx.recipientLabel },
    {
      label: "Initial funding",
      value: formatFundingAmount(ctx.amount, ctx.tokenLabel),
    },
  ];
  if (ctx.documentUrl) {
    rows.push({
      label: "Document",
      value: ctx.documentLabel || ctx.documentUrl,
      href: ctx.documentUrl,
      showLock: true,
    });
  }
  if (ctx.imageUrl) {
    rows.push({
      label: "Image",
      value: ctx.imageLabel || ctx.imageUrl,
      href: ctx.imageUrl,
      showLock: true,
    });
  }
  return rows;
}

function specializedPreview(
  values: PaymentTermsValues,
  ctx: ConfirmPreviewContext
): Pick<ConfirmPreview, "narrative" | "termRows" | "legend"> {
  const name = ctx.recipientLabel;
  switch (values.specialized) {
    case "bills":
      return {
        narrative: toNarrative(
          name,
          "You're issuing a transferable bill to ",
          ". The holder can redeem it."
        ),
        termRows: [],
        legend: "Set by the bill terms.",
      };
    case "compliance":
      return {
        narrative: toNarrative(
          name,
          "You're sending a compliance-controlled payment to ",
          ". Funds can only move between allowlisted addresses."
        ),
        termRows: [],
        legend: "Set by the compliance terms.",
      };
    case "probabilistic":
      return {
        narrative: toNarrative(
          name,
          "You're sending a probabilistic payment to ",
          ". It pays out with a set probability instead of a fixed amount."
        ),
        termRows: [],
        legend: "Set by the probabilistic terms.",
      };
    case "onchainChat":
      return {
        narrative: toNarrative(
          name,
          "You're attaching a payment to an onchain message with ",
          "."
        ),
        termRows: [],
        legend: "Set by the onchain chat terms.",
      };
    case "timelockPromise": {
      const when = formatConfirmDate(values.releaseDate);
      const pay = formatFundingAmount(values.firstHalfAmount, ctx.tokenLabel);
      const total = Number(ctx.amount);
      const first = Number(values.firstHalfAmount);
      const deposit =
        Number.isFinite(total) && Number.isFinite(first)
          ? formatFundingAmount(String(total - first), ctx.tokenLabel)
          : "your deposit";
      return {
        narrative: toNarrative(
          name,
          "You're sending a locked payment plus a deposit to ",
          ". Their pay unlocks on the date below. Your deposit comes back unless you approve it."
        ),
        termRows: [
          { label: "Unlocks", value: when || "the chosen date" },
          { label: "Their pay", value: pay },
          { label: "Your deposit", value: deposit },
        ],
        legend: "Set by the promise terms.",
      };
    }
    case "forwarderReverser":
      return {
        narrative: toNarrative(
          name,
          "You're sending a reversible payment to ",
          ". You can release it to them; the person you named can send it back to you."
        ),
        termRows: [
          {
            label: "Reverser",
            value: resolvePartyLabel(
              values.reverserAddress,
              values.resolvedReverserAddress,
              ctx.ensNames,
              "Reverser"
            ),
          },
        ],
        legend: "Set by the reversible terms.",
      };
    case "reversibleBeforeDelayable": {
      const until = formatConfirmDate(values.inspectionEndDate);
      return {
        narrative: toNarrative(
          name,
          "You're sending a reversible payment to ",
          ". You can take it back until the date below, and pay to push that date later."
        ),
        termRows: [
          {
            label: "Reversible until",
            value: until || "the chosen date",
          },
          {
            label: "Cost to extend",
            value: `${formatFundingAmount(
              values.delayCostPerDay,
              ctx.tokenLabel
            )} per day`,
          },
        ],
        legend: "Set by the reversible terms.",
      };
    }
    case "reversibleStartsLocked": {
      const until = formatConfirmDate(values.inspectionEndDate);
      return {
        narrative: toNarrative(
          name,
          "You're sending a reversible payment to ",
          ". After a lock period you can take it back, until they can claim."
        ),
        termRows: [
          {
            label: "Recipient claims after",
            value: until || "the chosen date",
          },
          {
            label: "Refunds unlock",
            value: "Halfway to that date",
          },
        ],
        legend: "Set by the reversible terms.",
      };
    }
    case "customHook":
      return {
        narrative: toNarrative(
          name,
          "You're sending a payment to ",
          ", governed by the custom hook you pasted."
        ),
        termRows: values.customHookAddress.trim()
          ? [
              {
                label: "Hook",
                value: isAddress(values.customHookAddress.trim())
                  ? truncateAddress(values.customHookAddress.trim())
                  : values.customHookAddress.trim(),
              },
            ]
          : [],
        legend: "Set by the custom hook.",
      };
    default:
      return {
        narrative: toNarrative(name, "You're sending a payment to ", "."),
        termRows: [],
        legend: null,
      };
  }
}

/**
 * Receipt-style copy and rows for Confirm. Shared facts (recipient, amount,
 * document) stay muted; term-specific rows are meant to be highlighted.
 */
export function buildConfirmPreview(
  values: PaymentTermsValues | undefined,
  ctx: ConfirmPreviewContext
): ConfirmPreview {
  const base = {
    sharedRows: sharedRows(ctx),
  };
  const name = ctx.recipientLabel || "the recipient";

  if (!values || (!values.term && !values.specialized)) {
    return {
      ...base,
      narrative: toNarrative(name, "You're sending a payment to ", "."),
      termRows: [],
      legend: null,
    };
  }

  if (values.specialized) {
    const specialized = specializedPreview(values, ctx);
    return { ...base, ...specialized };
  }

  switch (values.term) {
    case "recipientClaims": {
      const deadline = formatConfirmDate(values.claimDeadline);
      if (values.claimDestination === "anyAddress") {
        return {
          ...base,
          narrative: toNarrative(
            name,
            "You're sending a payment to ",
            ". They can send the funds to any address they choose."
          ),
          termRows: [
            {
              label: "Claimable",
              value:
                values.claimWhen === "beforeDeadline" && deadline
                  ? `Until ${deadline}`
                  : "Anytime",
            },
            { label: "Destination", value: "Any address they choose" },
          ],
          legend: "Set by the claim terms.",
        };
      }
      if (values.claimWhen === "beforeDeadline") {
        return {
          ...base,
          narrative: toNarrative(
            name,
            "You're sending a payment to ",
            ". They can claim it until the deadline, after which only you can recover it."
          ),
          termRows: [
            {
              label: "Claimable until",
              value: deadline || "the chosen date",
            },
          ],
          legend: "Set by the claim terms.",
        };
      }
      return {
        ...base,
        narrative: toNarrative(
          name,
          "You're sending a payment to ",
          ". They can claim the funds at any time."
        ),
        termRows: [{ label: "Claimable", value: "Anytime" }],
        legend: "Set by the claim terms.",
      };
    }

    case "someoneReviews": {
      const untilDate =
        values.refundWindow === "untilDate"
          ? formatConfirmDate(values.inspectionEndDate)
          : "";
      const after =
        values.reviewer === "me"
          ? untilDate
            ? ". You can claw it back before the reversal deadline. After that, they can claim it."
            : ". You can release it to them or refund it to yourself at any time."
          : untilDate
            ? ". It can be clawed back before the reversal deadline, at the reviewer's decision. After that, they can claim it."
            : ". It can be clawed back at the reviewer's decision.";
      const termRows: ConfirmDetailRow[] = [
        {
          label: "Reversible until",
          value: untilDate || "Anytime",
        },
        {
          label: "Reviewer",
          value: reviewerValue(values, ctx.ensNames),
        },
      ];
      return {
        ...base,
        narrative: toNarrative(
          name,
          "You're sending a reversible payment to ",
          after
        ),
        termRows,
        legend: "Set by the reversible terms.",
      };
    }

    case "releaseOverTime": {
      switch (values.releaseSchedule) {
        case "recurring": {
          const chunk = formatFundingAmount(
            values.chunkAmount,
            ctx.tokenLabel
          );
          const until = formatConfirmDate(values.returnAfterDate);
          const termRows: ConfirmDetailRow[] = [
            {
              label: "Release rate",
              value: `${chunk} ${chunkPeriodPhrase(values)}`,
              hint: dripDurationHint(values, ctx.amount),
            },
          ];
          if (values.unclaimedBehavior === "return" && until) {
            termRows.push({ label: "Unclaimed returns after", value: until });
          } else if (values.unclaimedBehavior === "stay") {
            termRows.push({
              label: "Unclaimed chunks",
              value: "Stay claimable",
            });
          }
          const dripAfter =
            values.unclaimedBehavior === "return"
              ? ". Chunks unlock on a fixed schedule. Unclaimed chunks are forfeited, and whatever remains returns to you after the window closes."
              : ". Chunks unlock on a fixed schedule. Unclaimed chunks stay claimable.";
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're funding a drip payment to ",
              dripAfter
            ),
            termRows,
            legend: "Set by the drip terms.",
          };
        }
        case "specificDate": {
          const when = formatConfirmDate(values.releaseDate);
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're sending a timed payment to ",
              ". Funds unlock on the date below."
            ),
            termRows: [
              { label: "Releases on", value: when || "the chosen date" },
              ...(values.allowEarlyRelease
                ? [{ label: "Early release", value: "You can release it early" }]
                : []),
            ],
            legend: "Set by the release terms.",
          };
        }
        case "stream": {
          const start = formatConfirmDate(values.streamStart);
          const end = formatConfirmDate(values.streamEnd);
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're funding a stream to ",
              ". Funds unlock continuously between the dates below."
            ),
            termRows: [
              { label: "Stream starts", value: start || "the start date" },
              { label: "Stream ends", value: end || "the end date" },
            ],
            legend: "Set by the stream terms.",
          };
        }
        case "milestones":
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're funding a milestone vesting agreement for ",
              ". Funds release on the schedule below."
            ),
            termRows: [],
            legend: "Set by the milestone terms.",
          };
        case "customVesting":
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're funding a vesting agreement for ",
              ". Funds release on the custom schedule you defined."
            ),
            termRows: [],
            legend: "Set by the vesting terms.",
          };
        default:
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're funding a timed payment to ",
              "."
            ),
            termRows: [],
            legend: "Set by the release terms.",
          };
      }
    }

    case "conditionMet": {
      switch (values.conditionTrigger) {
        case "ownership": {
          const comparison =
            CONDITION_TYPE_PHRASES[values.conditionType] ?? "at least";
          const until = formatConfirmDate(values.conditionExpiration);
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're sending a payment to ",
              ". They can claim it while they hold the required NFT, until the window closes."
            ),
            termRows: [
              {
                label: "Must hold",
                value: `${comparison} ${nftCountPhrase(
                  values.nftBalanceThreshold.trim() || "1"
                )}`,
              },
              {
                label: "Collection",
                value: collectionLabel(
                  values.nftCollectionAddress,
                  ctx.ensNames
                ),
              },
              ...(until
                ? [{ label: "Claimable until", value: until }]
                : []),
            ],
            legend: "Set by the condition terms.",
          };
        }
        case "price":
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're sending a payment to ",
              ". They can claim it once the price condition is met."
            ),
            termRows: [
              {
                label: "Asset",
                value: values.priceAsset.trim() || "the asset",
              },
              {
                label: "Unlocks",
                value: `${values.priceDirection} ${values.priceTarget.trim() || "the target"}`,
              },
            ],
            legend: "Set by the condition terms.",
          };
        case "onchainState": {
          const comparison = (
            CONDITION_TYPE_LABELS[values.onchainCondition as ConditionType] ??
            "Equal to"
          ).toLowerCase();
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're sending a payment to ",
              ". They can claim it once the onchain condition is met."
            ),
            termRows: [
              {
                label: "Unlocks when",
                value:
                  values.onchainUnlock === "returnValue"
                    ? `Read is ${comparison} ${values.onchainExpected.trim() || "the expected value"}`
                    : "The contract call succeeds",
              },
            ],
            legend: "Set by the condition terms.",
          };
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
          return {
            ...base,
            narrative: toNarrative(
              name,
              "You're sending a payment to ",
              `. They can claim it once they hold a valid ${kind}.`
            ),
            termRows: [{ label: "Requires", value: kind }],
            legend: "Set by the condition terms.",
          };
        }
        default:
          return {
            ...base,
            narrative: toNarrative(name, "You're sending a payment to ", "."),
            termRows: [],
            legend: "Set by the condition terms.",
          };
      }
    }

    case "payMultiple":
      return {
        ...base,
        narrative: toNarrative(
          name,
          "You're sending a split payment involving ",
          " and the other recipients you named."
        ),
        termRows: [
          {
            label: "Distribution",
            value:
              values.distribution === "fixedSplit"
                ? "Fixed split"
                : values.distribution === "inOrder"
                  ? "In order"
                  : values.sharedPotKind === "fundraiser"
                    ? "Shared pot"
                    : values.sharedPotKind === "rotatingSavings"
                      ? "Rotating savings"
                      : "Round-robin",
          },
        ],
        legend: "Set by the split terms.",
      };

    default:
      return {
        ...base,
        narrative: toNarrative(name, "You're sending a payment to ", "."),
        termRows: [],
        legend: null,
      };
  }
}
