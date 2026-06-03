import {
  isClaimableModule,
  resolveClaimableHook,
} from "./expirationDate";
import {
  isReversibleFormModule,
  resolveReversibleHook,
} from "./reversibleModule";

export function resolveWriteModule(formValues: {
  module?: string;
  expirationDate?: string;
  recoverableWhen?: string;
  inspectionEndDate?: string;
}): string {
  const module = formValues.module ?? "";
  if (isClaimableModule(module)) {
    return resolveClaimableHook(formValues.expirationDate);
  }
  if (isReversibleFormModule(module)) {
    return resolveReversibleHook(
      formValues.recoverableWhen,
      formValues.inspectionEndDate
    );
  }
  return module;
}
