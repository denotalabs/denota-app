export const BALANCE_CHECK_DEBOUNCE_MS = 1000;

export function hasValidPaymentAmount(amount: string | undefined): boolean {
  if (amount === undefined || amount === "") {
    return false;
  }
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed > 0;
}
