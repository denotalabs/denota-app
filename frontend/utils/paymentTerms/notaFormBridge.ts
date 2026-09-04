import {
  RECOVERABLE_ALWAYS,
  REVERSIBLE_BEFORE_DATE,
} from "../reversibleModule";
import { resolveHook } from "./resolveHook";
import type { PaymentTermsValues } from "./types";

/**
 * Keys the write path (`useConfirmNota`, Confirm card, hookData preview)
 * reads. The full answers are kept under `terms` so the screen can restore
 * itself and Confirm can rebuild the receipt.
 */
export interface TermsNotaFormSlice {
  terms: PaymentTermsValues;
  module: string;
  expirationDate: string;
  recoverableWhen: string;
  inspectionEndDate: string;
  auditor: string;
  resolvedAuditor: string;
  dripAmount: string;
  dripPeriodPreset: string;
  dripPeriodAmount: string;
  dripPeriodUnit: string;
  nftCollectionAddress: string;
  conditionType: string;
  nftBalanceThreshold: string;
}

/**
 * Flattens the collected answers into the fields the existing module writers
 * expect. Only live hooks produce a `module`; anything else is left empty so
 * Confirm cannot write it.
 */
export function termsToNotaForm(
  values: PaymentTermsValues,
  connectedAccount: string
): TermsNotaFormSlice {
  const resolved = resolveHook(values);
  const module = resolved?.module ?? "";

  const slice: TermsNotaFormSlice = {
    terms: values,
    module,
    expirationDate: "",
    recoverableWhen: RECOVERABLE_ALWAYS,
    inspectionEndDate: "",
    auditor: "",
    resolvedAuditor: "",
    dripAmount: "",
    dripPeriodPreset: values.chunkPeriodPreset,
    dripPeriodAmount: values.chunkPeriodAmount.trim(),
    dripPeriodUnit: values.chunkPeriodUnit,
    nftCollectionAddress: "",
    conditionType: values.conditionType,
    nftBalanceThreshold: "",
  };

  switch (module) {
    case "cashBeforeDate":
      slice.expirationDate = values.claimDeadline;
      break;
    case "reversibleRelease":
    case "reversibleByBeforeDate": {
      if (values.reviewer === "me") {
        slice.auditor = connectedAccount;
        slice.resolvedAuditor = "";
      } else {
        slice.auditor = values.reviewerAddress.trim();
        slice.resolvedAuditor = values.resolvedReviewerAddress.trim();
      }
      if (module === "reversibleByBeforeDate") {
        slice.recoverableWhen = REVERSIBLE_BEFORE_DATE;
        slice.inspectionEndDate = values.inspectionEndDate;
      }
      break;
    }
    case "cashBeforeDateDrip":
      slice.expirationDate = values.returnAfterDate;
      slice.dripAmount = values.chunkAmount.trim();
      break;
    case "balanceOfConditionalCash":
      slice.expirationDate = values.conditionExpiration;
      slice.nftCollectionAddress = values.nftCollectionAddress.trim();
      slice.nftBalanceThreshold = values.nftBalanceThreshold.trim();
      break;
    default:
      break;
  }

  return slice;
}
