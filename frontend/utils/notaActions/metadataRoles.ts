import { isAddress } from "ethers/lib/utils";
import {
  getMetadataAttribute,
  TokenMetadata,
} from "../notaTokenUri";

function normalizeRoleAddress(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!isAddress(trimmed)) {
    return null;
  }
  return trimmed.toLowerCase();
}

export function extractInspectorFromMetadata(
  metadata: TokenMetadata | null | undefined
): string | null {
  if (!metadata) {
    return null;
  }
  return normalizeRoleAddress(getMetadataAttribute(metadata, "Inspector"));
}

export function extractPayerFromMetadata(
  metadata: TokenMetadata | null | undefined
): string | null {
  if (!metadata) {
    return null;
  }
  return (
    normalizeRoleAddress(getMetadataAttribute(metadata, "Payer")) ??
    normalizeRoleAddress(getMetadataAttribute(metadata, "Sender"))
  );
}
