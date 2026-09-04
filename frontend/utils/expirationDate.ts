export type ClaimableHook = "simpleCash" | "cashBeforeDate";

/** Form module key for the Claimable card (resolved to a hook at write time). */
export const CLAIMABLE_MODULE = "claimable";

export function isClaimableModule(module: string): boolean {
  return (
    module === CLAIMABLE_MODULE ||
    module === "simpleCash" ||
    module === "cashBeforeDate"
  );
}

export function resolveClaimableHook(
  expirationDate?: string
): ClaimableHook {
  return expirationDate?.trim() ? "cashBeforeDate" : "simpleCash";
}

/**
 * Parses `expirationDate` from the form: `datetime-local` (YYYY-MM-DDTHH:mm:ss)
 * or legacy date-only (YYYY-MM-DD, end of that local day).
 */
export function expirationDateToCashBeforeDateMs(dateStr: string): number {
  const trimmed = dateStr.trim();
  if (trimmed.includes("T")) {
    return new Date(trimmed).getTime();
  }
  const [year, month, day] = trimmed.split("-").map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
}

/** Local `datetime-local` value (YYYY-MM-DDTHH:mm:ss). */
export function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** Default "must claim before" for drip: one calendar month from now (local time). */
export function dateTimeLocalOneMonthFromNow(from: Date = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return formatDateTimeLocal(d);
}

/** Confirm-row datetime: "Mar 14, 2026, 11:59 PM". */
export function formatConfirmDate(dateStr: string): string {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return "";
  }
  const ms = expirationDateToCashBeforeDateMs(trimmed);
  if (!Number.isFinite(ms)) {
    return "";
  }
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
