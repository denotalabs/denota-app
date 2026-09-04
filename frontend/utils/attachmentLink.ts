import { parseMetadataUri } from "./metadataUri";

const MAX_DISPLAY_LENGTH = 38;
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Validate a pasted attachment link and return the value to store.
 *
 * A link is accepted when it parses as a URL whose hostname contains a dot
 * (`https://` is prepended when no scheme is given), or when it resolves to
 * an IPFS CID, which the rest of the app already knows how to display.
 */
export function validateAttachmentLink(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }

  const parsedMetadata = parseMetadataUri(trimmed);
  if (parsedMetadata.cid) {
    return parsedMetadata.normalized;
  }

  const candidate = HAS_SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  const hostname = url.hostname;
  if (!hostname.includes(".") || hostname.startsWith(".") || hostname.endsWith(".")) {
    return null;
  }
  return candidate;
}

/** Human-friendly label for an attached link: no scheme, no www., truncated. */
export function attachmentDisplayName(value: string): string {
  const stripped = value
    .trim()
    .replace(HAS_SCHEME, "")
    .replace(/^www\./i, "");
  if (stripped.length <= MAX_DISPLAY_LENGTH) {
    return stripped;
  }
  return `${stripped.slice(0, MAX_DISPLAY_LENGTH)}…`;
}

const FILE_NAME_PATTERN =
  /\.(pdf|doc|docx|csv|png|jpe?g|gif|webp|svg|json)(\?|#|$)/i;

/**
 * Prefer a real filename (vesting.pdf) when the URI path has one; otherwise
 * fall back to the truncated host/path label.
 */
export function attachmentFileName(
  uri: string,
  uploadedName?: string
): string {
  const trimmed = uri.trim();
  const path = trimmed.replace(HAS_SCHEME, "").split(/[?#]/)[0];
  const last = path.split("/").filter(Boolean).pop() ?? "";
  try {
    const decoded = decodeURIComponent(last);
    if (FILE_NAME_PATTERN.test(decoded)) {
      return decoded;
    }
  } catch {
    // Malformed percent-encoding; use the raw segment below.
  }
  if (FILE_NAME_PATTERN.test(last)) {
    return last;
  }
  const uploaded = uploadedName?.trim();
  if (uploaded) {
    return uploaded;
  }
  return attachmentDisplayName(trimmed);
}
