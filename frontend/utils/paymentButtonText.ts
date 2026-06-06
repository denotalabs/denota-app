import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { requiresRegistrarApproval } from "../components/write/details/paymentMetadata";
import { PaymentType } from "../components/write/details/PaymentTypeField";
import { purchaseLabelFor } from "../hooks/usePurchaseToken";

export interface PaymentButtonTextOptions {
  token: string;
  isWalletConnected?: boolean;
  isCheckingReadiness?: boolean;
  insufficientBalance?: boolean;
  needsApproval?: boolean;
  paymentType?: PaymentType;
  mode?: string;
}

export function paymentButtonText({
  token,
  isWalletConnected = true,
  isCheckingReadiness = false,
  insufficientBalance = false,
  needsApproval = false,
  paymentType,
  mode,
}: PaymentButtonTextOptions): string {
  if (paymentType === "withTerms") {
    return "Payment Terms";
  }

  if (!isWalletConnected) {
    return "Connect wallet";
  }

  if (isCheckingReadiness) {
    if (paymentType === "sendOnly") {
      return "Send Payment";
    }
    return "Confirm Payment";
  }

  if (insufficientBalance) {
    return purchaseLabelFor(token as NotaCurrency);
  }

  const needsRegistrar =
    paymentType === undefined || requiresRegistrarApproval(paymentType);
  if (needsApproval && needsRegistrar) {
    return `Approve ${token}`;
  }

  if (mode === "invoice") {
    return "Create Invoice";
  }

  if (paymentType === "sendOnly") {
    return "Send Payment";
  }

  return "Confirm Payment";
}
