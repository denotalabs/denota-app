import type { GroupAmountMode } from "./types";

/** One signer per non-empty line or comma-separated entry. */
export function parseGroupSigners(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Amounts stored one per line, parallel to `groupSigners`. An empty string is
 * no amounts yet (so we can seed an even split); otherwise blank lines are
 * kept so a cleared input stays aligned with its signer.
 */
export function parseGroupAmounts(value: string): string[] {
  if (!value.trim()) {
    return [];
  }
  return value.split("\n").map((entry) => entry.trim());
}

export function joinGroupAmounts(amounts: string[]): string {
  return amounts.join("\n");
}

/** Compact decimal for seeded / converted shares. */
export function formatPortion(value: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }
  return String(Number(value.toPrecision(6)));
}

export function evenSplit(total: number, count: number): string[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1) {
    return [formatPortion(total)];
  }
  const head = formatPortion(total / count);
  const headN = Number(head);
  const parts = Array.from({ length: count - 1 }, () => head);
  parts.push(formatPortion(total - headN * (count - 1)));
  return parts;
}

/** 100% in percent mode; the escrow amount in absolute mode when known. */
export function groupAmountTotal(
  mode: GroupAmountMode,
  escrowAmount: string | undefined
): number {
  if (mode === "percent") {
    return 100;
  }
  const n = Number(escrowAmount);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Keep custom shares when the count is unchanged; otherwise even-split. */
export function resizeGroupAmounts(
  existing: string[],
  count: number,
  total: number
): string[] {
  if (count <= 0) {
    return [];
  }
  if (existing.length === count) {
    return existing;
  }
  return evenSplit(total, count);
}

export function convertGroupAmounts(
  amounts: string[],
  from: GroupAmountMode,
  to: GroupAmountMode,
  escrow: number
): string[] {
  if (from === to || amounts.length === 0) {
    return amounts;
  }
  if (!(escrow > 0)) {
    return to === "percent" ? evenSplit(100, amounts.length) : amounts;
  }
  return amounts.map((value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      return "";
    }
    return from === "percent"
      ? formatPortion((n / 100) * escrow)
      : formatPortion((n / escrow) * 100);
  });
}

export function sumGroupAmounts(amounts: string[]): number | null {
  if (amounts.length === 0) {
    return null;
  }
  let sum = 0;
  for (const value of amounts) {
    const n = Number(value);
    if (!value.trim() || !Number.isFinite(n)) {
      return null;
    }
    sum += n;
  }
  return sum;
}

/** True when two money / percent totals are close enough to treat as equal. */
export function amountsNearlyEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(0.01, Math.abs(b) * 1e-6);
}
