import {
  BALANCE_OF_CONDITIONAL_CASH_MODULE,
  defaultBalanceOfConditionalCashFormValues,
} from "./balanceOfConditionalCash";
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
  nftCollectionAddress: string;
  conditionType: string;
  nftBalanceThreshold: string;
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
  nftCollectionAddress?: string;
  conditionType?: string;
  nftBalanceThreshold?: string;
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
  const balanceOfConditionalCashDefaults =
    notaFormValues.module === BALANCE_OF_CONDITIONAL_CASH_MODULE
      ? defaultBalanceOfConditionalCashFormValues()
      : null;

  return {
    inspection: notaFormValues.inspection
      ? Number(notaFormValues.inspection)
      : 604800,
    module: notaFormValues.module ?? CLAIMABLE_MODULE,
    expirationDate: notaFormValues.expirationDate?.trim()
      ? notaFormValues.expirationDate
      : notaFormValues.module === CASH_BEFORE_DATE_DRIP_MODULE
        ? dateTimeLocalOneMonthFromNow()
        : notaFormValues.module === BALANCE_OF_CONDITIONAL_CASH_MODULE
          ? (balanceOfConditionalCashDefaults?.expirationDate ??
            dateTimeLocalOneMonthFromNow())
          : (notaFormValues.expirationDate ?? ""),
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
    nftCollectionAddress: notaFormValues.nftCollectionAddress ?? "",
    conditionType:
      notaFormValues.conditionType ??
      balanceOfConditionalCashDefaults?.conditionType ??
      "",
    nftBalanceThreshold:
      notaFormValues.nftBalanceThreshold ??
      balanceOfConditionalCashDefaults?.nftBalanceThreshold ??
      "",
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
    nftCollectionAddress: values.nftCollectionAddress,
    conditionType: values.conditionType,
    nftBalanceThreshold: values.nftBalanceThreshold,
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
