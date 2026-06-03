export function hasPaymentMetadata(values: {
  note?: string;
  file?: File | undefined;
  tags?: string;
  externalURI?: string;
  imageURI?: string;
}): boolean {
  return !!(
    values.note?.trim() ||
    values.file ||
    values.tags?.trim() ||
    values.externalURI?.trim() ||
    values.imageURI?.trim()
  );
}

export function requiresRegistrarApproval(paymentType: string): boolean {
  return paymentType === "withReceipt";
}

export function allowsZeroPaymentAmount(paymentType: string): boolean {
  return paymentType === "withTerms" || paymentType === "withReceipt";
}

export function showsMetadataForm(paymentType: string): boolean {
  return paymentType !== "sendOnly";
}
