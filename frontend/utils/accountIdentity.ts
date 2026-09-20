import { ethers } from "ethers";
import { couldBeEnsInProgress, isEnsName } from "./ensAddress";

export type AccountInputKind =
  | "empty"
  | "address"
  | "ens"
  | "email"
  | "phone"
  | "ensInProgress"
  | "emailInProgress"
  | "phoneInProgress"
  | "invalid";

const EMAIL_COMPLETE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^[+\d().\-\s]+$/;

export function normalizeEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!EMAIL_COMPLETE.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function isEmail(value: string): boolean {
  return normalizeEmail(value) !== null;
}

export function couldBeEmailInProgress(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.includes("@") && !/\s/.test(trimmed);
}

/** E.164, or US 10-digit / 11-digit-with-leading-1 without a plus. */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !PHONE_CHARS.test(trimmed)) {
    return null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    return null;
  }
  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return null;
}

export function isPhone(value: string): boolean {
  return normalizePhone(value) !== null;
}

export function couldBePhoneInProgress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !PHONE_CHARS.test(trimmed) || ethers.utils.isAddress(trimmed)) {
    return false;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0) {
    return trimmed.startsWith("+");
  }
  return digits.length <= 15;
}

export function classifyAccountInput(value: string): AccountInputKind {
  const trimmed = value.trim();
  if (!trimmed) {
    return "empty";
  }
  if (ethers.utils.isAddress(trimmed)) {
    return "address";
  }
  if (isEnsName(trimmed)) {
    return "ens";
  }
  if (isEmail(trimmed)) {
    return "email";
  }
  if (couldBeEmailInProgress(trimmed)) {
    return "emailInProgress";
  }
  if (isPhone(trimmed)) {
    return "phone";
  }
  if (couldBePhoneInProgress(trimmed)) {
    return "phoneInProgress";
  }
  if (couldBeEnsInProgress(trimmed)) {
    return "ensInProgress";
  }
  return "invalid";
}

export function isAccountInputInProgress(kind: AccountInputKind): boolean {
  return (
    kind === "ensInProgress" ||
    kind === "emailInProgress" ||
    kind === "phoneInProgress"
  );
}

export function isLookupAccountKind(
  kind: AccountInputKind
): kind is "ens" | "email" | "phone" {
  return kind === "ens" || kind === "email" || kind === "phone";
}
