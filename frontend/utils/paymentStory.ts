import { isAddress } from "ethers/lib/utils";
import { truncateAddress } from "./address";
import {
  BALANCE_OF_CONDITIONAL_CASH_MODULE,
  CONDITION_TYPE_LABELS,
  ConditionType,
} from "./balanceOfConditionalCash";
import {
  CASH_BEFORE_DATE_DRIP_MODULE,
  DripPeriodPreset,
  DripPeriodUnit,
  formatDripPeriodFormDisplay,
} from "./dripPeriod";
import { getEffectiveAddress, isEnsName } from "./ensAddress";
import {
  expirationDateToCashBeforeDateMs,
  formatExpirationDateDisplay,
} from "./expirationDate";
import { resolveWriteModule } from "./resolveWriteModule";

export interface PaymentStoryFormValues {
  module?: string;
  amount?: string;
  token?: string;
  address?: string;
  resolvedAddress?: string;
  auditor?: string;
  resolvedAuditor?: string;
  expirationDate?: string;
  inspectionEndDate?: string;
  recoverableWhen?: string;
  dripAmount?: string;
  dripPeriodPreset?: string;
  dripPeriodAmount?: string;
  dripPeriodUnit?: string;
  nftCollectionAddress?: string;
  conditionType?: string;
  nftBalanceThreshold?: string;
}

export interface PaymentStoryInput {
  formValues: PaymentStoryFormValues;
  senderAddress: string;
  ensNames: Map<string, string | null>;
  tokenLabel: string;
  now?: Date;
}

function formatPartyLabel(
  formInput: string | undefined,
  resolvedAddress: string,
  senderAddress: string,
  ensNames: Map<string, string | null>
): string {
  const trimmedInput = formInput?.trim() ?? "";

  if (trimmedInput && isEnsName(trimmedInput)) {
    return trimmedInput.toLowerCase();
  }

  const effective =
    resolvedAddress && isAddress(resolvedAddress)
      ? resolvedAddress
      : trimmedInput && isAddress(trimmedInput)
        ? trimmedInput
        : "";

  if (effective && isAddress(effective)) {
    const normalized = effective.toLowerCase();
    if (senderAddress && normalized === senderAddress.toLowerCase()) {
      return "you";
    }
    const ens = ensNames.get(normalized);
    if (ens) {
      return ens;
    }
    return truncateAddress(effective);
  }

  if (trimmedInput) {
    return trimmedInput;
  }

  return "the recipient";
}

function daysUntil(dateStr: string, from: Date = new Date()): number {
  const trimmed = dateStr.trim();
  if (!trimmed) {
    return 0;
  }
  const ms = expirationDateToCashBeforeDateMs(trimmed);
  const diff = ms - from.getTime();
  if (diff <= 0) {
    return 0;
  }
  return Math.ceil(diff / 86400000);
}

function formatDripPeriodPhrase(formValues: PaymentStoryFormValues): string {
  const display = formatDripPeriodFormDisplay({
    dripPeriodPreset: formValues.dripPeriodPreset as DripPeriodPreset | undefined,
    dripPeriodAmount: formValues.dripPeriodAmount,
    dripPeriodUnit: formValues.dripPeriodUnit as DripPeriodUnit | undefined,
  });
  if (!display) {
    return "on a schedule";
  }
  return display.toLowerCase();
}

export function buildPaymentStory(input: PaymentStoryInput): string {
  const {
    formValues,
    senderAddress,
    ensNames,
    tokenLabel,
    now = new Date(),
  } = input;

  const amount = formValues.amount ?? "0";

  const recipient = formatPartyLabel(
    formValues.address,
    getEffectiveAddress(formValues.address ?? "", formValues.resolvedAddress),
    senderAddress,
    ensNames
  );

  const sender = formatPartyLabel(
    undefined,
    senderAddress,
    senderAddress,
    ensNames
  );

  const auditorInput = formValues.auditor?.trim() ?? "";
  const inspectorResolved = getEffectiveAddress(
    formValues.auditor ?? "",
    formValues.resolvedAuditor
  );
  const inspectorAddress =
    inspectorResolved ||
    (auditorInput && isAddress(auditorInput) ? auditorInput : senderAddress);
  const inspector = formatPartyLabel(
    auditorInput || undefined,
    inspectorAddress,
    senderAddress,
    ensNames
  );

  const hook = resolveWriteModule(formValues);

  switch (hook) {
    case "reversibleByBeforeDate": {
      const inspectionEnd = formValues.inspectionEndDate ?? "";
      const days = daysUntil(inspectionEnd, now);
      const absoluteDate = formatExpirationDateDisplay(inspectionEnd);
      const dayPhrase = days === 1 ? "1 day" : `${days} days`;
      return `${recipient} may access ${amount} ${tokenLabel} after ${dayPhrase} (${absoluteDate}), provided arbitrator (${inspector}) does not reverse them to ${sender} before then.`;
    }
    case "reversibleRelease":
      return `${amount} ${tokenLabel} shall be held in escrow for ${recipient}. Arbitrator (${inspector}) may release funds to ${recipient} or reverse them to ${sender} at any time.`;
    case "cashBeforeDate": {
      const deadline = formatExpirationDateDisplay(
        formValues.expirationDate ?? ""
      );
      return `${amount} ${tokenLabel} shall be held in escrow for ${recipient}. ${recipient} must claim before ${deadline} or funds return to ${sender}.`;
    }
    case "simpleCash":
      return `${amount} ${tokenLabel} shall be held in escrow for ${recipient}. ${recipient} may claim the funds at any time.`;
    case CASH_BEFORE_DATE_DRIP_MODULE: {
      const deadline = formatExpirationDateDisplay(
        formValues.expirationDate ?? ""
      );
      const dripAmount = formValues.dripAmount ?? "1";
      const period = formatDripPeriodPhrase(formValues);
      return `${amount} ${tokenLabel} shall be held in escrow for ${recipient}. ${recipient} may claim ${dripAmount} ${tokenLabel} ${period} until ${deadline}. Unclaimed amounts in a period are forfeited.`;
    }
    case "directSend":
      return `${amount} ${tokenLabel} shall be sent directly to ${recipient} upon confirmation.`;
    case BALANCE_OF_CONDITIONAL_CASH_MODULE: {
      const deadline = formatExpirationDateDisplay(
        formValues.expirationDate ?? ""
      );
      const threshold = formValues.nftBalanceThreshold ?? "1";
      const conditionLabel =
        CONDITION_TYPE_LABELS[
        (formValues.conditionType as ConditionType) ?? "GTEQ"
        ] ?? "at least";
      const collectionAddress = formValues.nftCollectionAddress?.trim() ?? "";
      const collection =
        collectionAddress && isAddress(collectionAddress)
          ? (ensNames.get(collectionAddress.toLowerCase()) ??
            truncateAddress(collectionAddress))
          : "the specified collection";
      return `${amount} ${tokenLabel} shall be held in escrow for ${recipient}. ${recipient} may claim the funds when their NFT balance from ${collection} is ${conditionLabel.toLowerCase()} ${threshold}. After ${deadline}, unclaimed funds return to ${sender}.`;
    }
    default:
      return `${amount} ${tokenLabel} shall be held in escrow for ${recipient} under the selected payment terms.`;
  }
}
