export type ReversibleHook = "reversibleRelease" | "reversibleByBeforeDate";

export const RECOVERABLE_ALWAYS = "Always";
export const REVERSIBLE_BEFORE_DATE = "Before date";

export function isReversibleFormModule(module: string): boolean {
  return (
    module === "reversibleRelease" || module === "reversibleByBeforeDate"
  );
}

export function resolveReversibleHook(
  recoverableWhen?: string,
  inspectionEndDate?: string
): ReversibleHook {
  if (
    recoverableWhen === REVERSIBLE_BEFORE_DATE &&
    inspectionEndDate?.trim()
  ) {
    return "reversibleByBeforeDate";
  }
  return "reversibleRelease";
}

/** Default reversible-by field: connected wallet, or blank if disconnected. */
export function initialAuditorFields(
  connectedAccount: string,
  auditor?: string,
  resolvedAuditor?: string
): { auditor: string; resolvedAuditor: string } {
  if (auditor != null && auditor !== "") {
    return { auditor, resolvedAuditor: resolvedAuditor ?? "" };
  }
  if (connectedAccount) {
    return { auditor: connectedAccount, resolvedAuditor: "" };
  }
  return { auditor: "", resolvedAuditor: "" };
}
