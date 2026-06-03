import {
  CASH_BEFORE_DATE_DRIP_MODULE,
  DripPeriodPreset,
  DripPeriodUnit,
  resolveDripPeriodSeconds,
} from "./dripPeriod";
import {
  expirationDateToCashBeforeDateMs,
  isClaimableModule,
} from "./expirationDate";
import { isReversibleFormModule, REVERSIBLE_BEFORE_DATE } from "./reversibleModule";

function validateFutureExpirationDate(
  expirationDate: string | undefined,
  errors: Record<string, string>,
  requiredMessage?: string
) {
  if (!expirationDate?.trim()) {
    if (requiredMessage) {
      errors.expirationDate = requiredMessage;
    }
    return;
  }
  if (expirationDateToCashBeforeDateMs(expirationDate) <= Date.now()) {
    errors.expirationDate = "Must claim before date must be in the future";
  }
}

export function validatePaymentTerms(values: {
  module?: string;
  expirationDate?: string;
  dripAmount?: string;
  dripPeriodPreset?: string;
  dripPeriodAmount?: string;
  dripPeriodUnit?: string;
  recoverableWhen?: string;
  inspectionEndDate?: string;
  milestones?: string[];
}) {
  const errors: Record<string, string> = {};

  if (values.module && isClaimableModule(values.module)) {
    if (values.expirationDate?.trim()) {
      validateFutureExpirationDate(values.expirationDate, errors);
    }
  }

  if (values.module === CASH_BEFORE_DATE_DRIP_MODULE) {
    validateFutureExpirationDate(
      values.expirationDate,
      errors,
      "Expiration date is required"
    );

    if (!values.dripAmount?.trim() || Number(values.dripAmount) <= 0) {
      errors.dripAmount = "Drip amount must be greater than 0";
    }

    if (values.dripPeriodPreset === "custom") {
      if (!values.dripPeriodAmount?.trim() || Number(values.dripPeriodAmount) <= 0) {
        errors.dripPeriod = "Custom drip period must be greater than 0";
      }
    }

    const dripPeriodSeconds = resolveDripPeriodSeconds({
      dripPeriodPreset: (values.dripPeriodPreset ?? "weekly") as DripPeriodPreset,
      dripPeriodAmount: values.dripPeriodAmount ?? "",
      dripPeriodUnit: (values.dripPeriodUnit ?? "hours") as DripPeriodUnit,
    });
    if (dripPeriodSeconds <= 0) {
      errors.dripPeriod = "Drip period must be at least 1 second";
    }
  }

  if (values.module && isReversibleFormModule(values.module)) {
    if (
      values.recoverableWhen === REVERSIBLE_BEFORE_DATE &&
      !values.inspectionEndDate?.trim()
    ) {
      errors.inspectionEndDate = "Inspection end is required";
    }
  }

  return errors;
}
