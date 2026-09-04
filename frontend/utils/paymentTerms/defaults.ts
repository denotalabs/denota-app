import {
  dateTimeLocalOneMonthFromNow,
  formatDateTimeLocal,
} from "../expirationDate";
import type { PaymentTermsValues } from "./types";

/** Default chunk for "Release it over time": 100, or a fifth of small escrows. */
export function seedChunkAmount(totalAmount: string | undefined): string {
  const total = Number(totalAmount);
  if (Number.isFinite(total) && total > 0 && total < 100) {
    return String(Number((total / 5).toPrecision(6)));
  }
  return "100";
}

/**
 * Seeds for every field, so no term opens to a wall of blanks. Selecting a
 * term resets to these plus the term, so configuration is editing, not
 * authoring.
 */
export function baseTermsValues(
  totalAmount: string | undefined,
  now: Date = new Date()
): PaymentTermsValues {
  const inOneMonth = dateTimeLocalOneMonthFromNow(now);
  return {
    term: "",
    specialized: "",

    claimWhen: "anytime",
    claimDeadline: inOneMonth,
    claimDestination: "recipient",

    reviewer: "me",
    reviewerAddress: "",
    resolvedReviewerAddress: "",
    refundWindow: "untilDecide",
    inspectionEndDate: inOneMonth,
    groupSigners: "",
    groupThreshold: "2",
    arbitrationProvider: "kleros",

    releaseSchedule: "recurring",
    releaseDate: inOneMonth,
    allowEarlyRelease: false,
    chunkAmount: seedChunkAmount(totalAmount),
    chunkPeriodPreset: "weekly",
    chunkPeriodAmount: "1",
    chunkPeriodUnit: "hours",
    // The live drip hook returns unclaimed funds to the payer after a
    // deadline, so it is the seed; "stay claimable" is not shippable yet.
    unclaimedBehavior: "return",
    returnAfterDate: inOneMonth,
    streamStart: formatDateTimeLocal(now),
    streamEnd: inOneMonth,

    conditionTrigger: "ownership",
    nftCollectionAddress: "",
    conditionType: "GTEQ",
    nftBalanceThreshold: "1",
    conditionExpiration: inOneMonth,
    priceAsset: "",
    priceDirection: "above",
    priceTarget: "",
    onchainContract: "",
    onchainCalldata: "",
    onchainExpected: "",
    attestationKind: "eas",

    distribution: "fixedSplit",
    sharedPotKind: "fundraiser",

    customHookAddress: "",
  };
}

/**
 * Initial values for the screen: a prior configuration when returning from
 * Confirm, otherwise the unselected state so the five cards render.
 */
export function initialTermsValues(notaFormValues: {
  terms?: unknown;
  amount?: string;
}): PaymentTermsValues {
  const base = baseTermsValues(notaFormValues.amount);
  const saved = notaFormValues.terms;
  return saved && typeof saved === "object"
    ? { ...base, ...(saved as Partial<PaymentTermsValues>) }
    : base;
}
