import { ethers } from "ethers";

export function isEnsName(value: string): boolean {
  return value.trim().toLowerCase().endsWith(".eth");
}

export function couldBeEnsInProgress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("0x")) {
    return false;
  }
  return /^[a-zA-Z0-9.-]+$/.test(trimmed) && !ethers.utils.isAddress(trimmed);
}

export function normalizeEnsName(name: string): string {
  return name.trim().toLowerCase();
}

export function getEffectiveAddress(
  address: string,
  resolvedAddress?: string
): string {
  if (resolvedAddress && ethers.utils.isAddress(resolvedAddress)) {
    return ethers.utils.getAddress(resolvedAddress);
  }
  return address;
}
