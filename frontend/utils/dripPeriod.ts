import { dateTimeLocalOneMonthFromNow } from "./expirationDate";

export const CASH_BEFORE_DATE_DRIP_MODULE = "cashBeforeDateDrip";

export type DripPeriodPreset = "daily" | "weekly" | "monthly" | "custom";
export type DripPeriodUnit = "seconds" | "minutes" | "hours" | "days" | "weeks";

export interface DripPeriodFormValues {
  dripPeriodPreset: DripPeriodPreset;
  dripPeriodAmount: string;
  dripPeriodUnit: DripPeriodUnit;
}

export const DRIP_PERIOD_PRESETS: {
  value: Exclude<DripPeriodPreset, "custom">;
  label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export const DRIP_PERIOD_UNITS: { value: DripPeriodUnit; label: string }[] = [
  { value: "seconds", label: "Seconds" },
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
];

const PRESET_SECONDS: Record<Exclude<DripPeriodPreset, "custom">, number> = {
  daily: 86400,
  weekly: 604800,
  monthly: 2592000,
};

const UNIT_SECONDS: Record<DripPeriodUnit, number> = {
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  weeks: 604800,
};

export const defaultDripPeriodFormValues: DripPeriodFormValues = {
  dripPeriodPreset: "weekly",
  dripPeriodAmount: "1",
  dripPeriodUnit: "hours",
};

export const defaultDripAmount = "1";

export function defaultCashBeforeDateDripFormValues() {
  return {
    expirationDate: dateTimeLocalOneMonthFromNow(),
    ...allDripFieldsFromNotaForm({}),
  };
}

export function allDripFieldsFromNotaForm(
  notaFormValues: Partial<DripPeriodFormValues & { dripAmount?: string }>
) {
  return {
    dripAmount: notaFormValues.dripAmount ?? defaultDripAmount,
    ...dripFieldsFromNotaForm(notaFormValues),
  };
}

export function resolveDripPeriodSeconds({
  dripPeriodPreset,
  dripPeriodAmount,
  dripPeriodUnit,
}: DripPeriodFormValues): number {
  if (dripPeriodPreset !== "custom") {
    return PRESET_SECONDS[dripPeriodPreset];
  }

  const amount = Number(dripPeriodAmount) || 0;
  return amount * UNIT_SECONDS[dripPeriodUnit];
}

export function formatDripPeriodFormDisplay(
  values: Partial<DripPeriodFormValues>
): string {
  const preset =
    values.dripPeriodPreset ?? defaultDripPeriodFormValues.dripPeriodPreset;
  const amount = values.dripPeriodAmount ?? defaultDripPeriodFormValues.dripPeriodAmount;
  const unit = values.dripPeriodUnit ?? defaultDripPeriodFormValues.dripPeriodUnit;

  if (preset !== "custom") {
    const presetEntry = DRIP_PERIOD_PRESETS.find((p) => p.value === preset);
    return presetEntry ? presetEntry.label : "";
  }

  const amountNum = Number(amount) || 0;
  if (amountNum <= 0) {
    return "";
  }

  const unitLabels: Record<DripPeriodUnit, [string, string]> = {
    seconds: ["second", "seconds"],
    minutes: ["minute", "minutes"],
    hours: ["hour", "hours"],
    days: ["day", "days"],
    weeks: ["week", "weeks"],
  };
  const [singular, plural] = unitLabels[unit];

  return `Every ${amountNum} ${amountNum === 1 ? singular : plural}`;
}

export function dripFieldsFromNotaForm(notaFormValues: Partial<DripPeriodFormValues>) {
  return {
    dripPeriodPreset:
      notaFormValues.dripPeriodPreset ?? defaultDripPeriodFormValues.dripPeriodPreset,
    dripPeriodAmount:
      notaFormValues.dripPeriodAmount ?? defaultDripPeriodFormValues.dripPeriodAmount,
    dripPeriodUnit:
      notaFormValues.dripPeriodUnit ?? defaultDripPeriodFormValues.dripPeriodUnit,
  };
}
