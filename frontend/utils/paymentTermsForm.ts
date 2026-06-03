import { CLAIMABLE_MODULE } from "./expirationDate";
import {
  initialAuditorFields,
  isReversibleFormModule,
  RECOVERABLE_ALWAYS,
} from "./reversibleModule";
import {
  allDripFieldsFromNotaForm,
  CASH_BEFORE_DATE_DRIP_MODULE,
} from "./dripPeriod";
import { dateTimeLocalOneMonthFromNow } from "./expirationDate";
import { validatePaymentTerms } from "./validatePaymentTerms";

export type PaymentTermsFormValues = {
  inspection: number;
  module: string;
  expirationDate: string;
  recoverableWhen: string;
  inspectionEndDate: string;
  auditor: string;
  resolvedAuditor: string;
  milestones: string[];
  dripAmount: string;
  dripPeriodPreset: string;
  dripPeriodAmount: string;
  dripPeriodUnit: string;
  axelarEnabled: boolean;
};

type NotaFormSlice = {
  inspection?: string | number;
  module?: string;
  expirationDate?: string;
  recoverableWhen?: string;
  inspectionEndDate?: string;
  auditor?: string;
  resolvedAuditor?: string;
  milestones?: string;
  amount?: string;
  axelarEnabled?: boolean | string;
  dripAmount?: string;
  dripPeriodPreset?: string;
  dripPeriodAmount?: string;
  dripPeriodUnit?: string;
};

export function getAuditorFieldsForPaymentTerms(
  notaFormValues: NotaFormSlice,
  connectedAccount: string
) {
  if (isReversibleFormModule(notaFormValues.module ?? "")) {
    return initialAuditorFields(
      connectedAccount,
      notaFormValues.auditor,
      notaFormValues.resolvedAuditor
    );
  }
  return {
    auditor: notaFormValues.auditor ?? "",
    resolvedAuditor: notaFormValues.resolvedAuditor ?? "",
  };
}

export function getPaymentTermsInitialValues(
  notaFormValues: NotaFormSlice,
  auditorFields: { auditor: string; resolvedAuditor: string },
  options?: { includeAxelar?: boolean }
): PaymentTermsFormValues {
  return {
    inspection: notaFormValues.inspection
      ? Number(notaFormValues.inspection)
      : 604800,
    module: notaFormValues.module ?? CLAIMABLE_MODULE,
    expirationDate:
      notaFormValues.expirationDate ??
      (notaFormValues.module === CASH_BEFORE_DATE_DRIP_MODULE
        ? dateTimeLocalOneMonthFromNow()
        : ""),
    recoverableWhen: notaFormValues.recoverableWhen ?? RECOVERABLE_ALWAYS,
    inspectionEndDate: notaFormValues.inspectionEndDate ?? "",
    auditor: auditorFields.auditor,
    resolvedAuditor: auditorFields.resolvedAuditor,
    milestones: notaFormValues.milestones
      ? notaFormValues.milestones.split(",")
      : [notaFormValues.amount ?? ""],
    ...allDripFieldsFromNotaForm(
      notaFormValues as Parameters<typeof allDripFieldsFromNotaForm>[0]
    ),
    axelarEnabled:
      options?.includeAxelar === true
        ? notaFormValues.axelarEnabled === true ||
          notaFormValues.axelarEnabled === "true"
        : false,
  };
}

export function paymentTermsValuesToNotaForm(
  values: PaymentTermsFormValues,
  options?: { includeAxelar?: boolean }
) {
  return {
    milestones: values.milestones.join(","),
    expirationDate: values.expirationDate,
    recoverableWhen: values.recoverableWhen,
    inspectionEndDate: values.inspectionEndDate,
    auditor: values.auditor,
    resolvedAuditor: values.resolvedAuditor,
    dripAmount: values.dripAmount,
    dripPeriodPreset: values.dripPeriodPreset,
    dripPeriodAmount: values.dripPeriodAmount,
    dripPeriodUnit: values.dripPeriodUnit,
    ...(options?.includeAxelar
      ? { axelarEnabled: values.axelarEnabled ? "true" : undefined }
      : {}),
  };
}

/** Validates using the active module from context (card selection), not stale Formik `module`. */
export function createValidatePaymentTerms(activeModule: string) {
  return (values: PaymentTermsFormValues) =>
    validatePaymentTerms({ ...values, module: activeModule });
}
