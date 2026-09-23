import type { DripPeriodUnit } from "../dripPeriod";
import { expirationDateToCashBeforeDateMs } from "../expirationDate";
import type { PaymentTermsValues } from "./types";

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

/**
 * When refunds unlock for "Refunds after a lock period": `percent` of the
 * time from `now` until `endDate`. Matches the hook's
 * `now + (inspectionEnd - now) * percent / 100` formula.
 */
export function lockUnlockMs(
  endDate: string,
  percent: string,
  nowMs: number = Date.now()
): number | null {
  const trimmed = endDate.trim();
  if (!trimmed) {
    return null;
  }
  const end = expirationDateToCashBeforeDateMs(trimmed);
  const pct = Number(percent);
  if (
    !Number.isFinite(end) ||
    !(end > nowMs) ||
    !Number.isFinite(pct) ||
    pct <= 0 ||
    pct >= 100
  ) {
    return null;
  }
  return nowMs + ((end - nowMs) * pct) / 100;
}
