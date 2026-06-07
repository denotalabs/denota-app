import { ipfsToHttpUrl } from "./ipfsGateway";

export type MetadataUriKind =
  | "empty"
  | "http"
  | "ipfs"
  | "bare-cid"
  | "gateway";

export interface ParsedMetadataUri {
  kind: MetadataUriKind;
  /** Value to store onchain (bare CIDs gain an ipfs:// prefix). */
  normalized: string;
  /** Root CID when the input resolves to IPFS, if any. */
  cid: string | null;
}

const CID_V0_PATTERN = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const CID_V1_PATTERN = /^baf[a-z2-7]+$/i;

export function isIpfsCid(value: string): boolean {
  const candidate = value.trim().split("/")[0];
  return CID_V0_PATTERN.test(candidate) || CID_V1_PATTERN.test(candidate);
}

function extractCidFromIpfsUri(value: string): string | null {
  const withoutScheme = value.slice("ipfs://".length).replace(/^ipfs\//, "");
  const cid = withoutScheme.split("/")[0]?.trim();
  return cid && isIpfsCid(cid) ? cid : null;
}

function extractCidFromGatewayUrl(value: string): string | null {
  const match = value.match(/\/ipfs\/([^/?#]+)/i);
  const cid = match?.[1]?.trim();
  return cid && isIpfsCid(cid) ? cid : null;
}

/** Classify a metadata URI and produce the normalized onchain value. */
export function parseMetadataUri(input: string): ParsedMetadataUri {
  const trimmed = input.trim();
  if (!trimmed) {
    return { kind: "empty", normalized: "", cid: null };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const gatewayCid = extractCidFromGatewayUrl(trimmed);
    if (gatewayCid) {
      const suffix = trimmed.slice(
        trimmed.toLowerCase().indexOf(`/ipfs/${gatewayCid}`) +
          `/ipfs/${gatewayCid}`.length
      );
      return {
        kind: "gateway",
        normalized: `ipfs://${gatewayCid}${suffix}`,
        cid: gatewayCid,
      };
    }
    return { kind: "http", normalized: trimmed, cid: null };
  }

  if (trimmed.startsWith("ipfs://")) {
    const cid = extractCidFromIpfsUri(trimmed);
    if (cid) {
      return { kind: "ipfs", normalized: trimmed, cid };
    }
    return { kind: "ipfs", normalized: trimmed, cid: null };
  }

  const bareCid = trimmed.split("/")[0]?.trim();
  if (bareCid && isIpfsCid(bareCid)) {
    const suffix = trimmed.slice(bareCid.length);
    return {
      kind: "bare-cid",
      normalized: `ipfs://${bareCid}${suffix}`,
      cid: bareCid,
    };
  }

  return { kind: "http", normalized: trimmed, cid: null };
}

/** Normalize metadata URI values before writing a nota. */
export function normalizeMetadataUri(input: string | undefined): string {
  if (!input?.trim()) {
    return "";
  }
  return parseMetadataUri(input).normalized;
}

export function normalizePaymentMetadataUris(values: {
  externalURI?: string;
  imageURI?: string;
}): { externalURI: string; imageURI: string } {
  return {
    externalURI: normalizeMetadataUri(values.externalURI),
    imageURI: normalizeMetadataUri(values.imageURI),
  };
}

export type IpfsVerificationStatus = "idle" | "checking" | "found" | "missing";

/** HEAD-check whether IPFS content is reachable via the configured gateway. */
export async function verifyIpfsAvailability(
  uri: string
): Promise<boolean> {
  const url = ipfsToHttpUrl(uri);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) {
      return true;
    }
    const getResponse = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(8_000),
    });
    return getResponse.ok;
  } catch {
    return false;
  }
}

export function metadataUriNeedsNormalization(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) {
    return false;
  }
  return parseMetadataUri(trimmed).normalized !== trimmed;
}

export function metadataUriHelperText(
  parsed: ParsedMetadataUri,
  verification: IpfsVerificationStatus,
  currentValue: string
): string | undefined {
  if (parsed.kind === "empty") {
    return undefined;
  }

  const trimmed = currentValue.trim();
  const isCommitted =
    trimmed.length > 0 && parsed.normalized === trimmed;

  if (parsed.cid) {
    if (verification === "checking") {
      return isCommitted
        ? "Checking IPFS content…"
        : `Will be stored as ${parsed.normalized}. Checking IPFS…`;
    }
    if (verification === "found") {
      return isCommitted
        ? "IPFS content found — this is what will be stored onchain."
        : `IPFS content found. Will be stored as ${parsed.normalized}.`;
    }
    if (verification === "missing") {
      return isCommitted
        ? "Could not verify IPFS content — double-check before continuing."
        : `Could not verify IPFS content. Will be stored as ${parsed.normalized}.`;
    }
    if (!isCommitted) {
      return `Will be stored onchain as ${parsed.normalized}.`;
    }
    return "IPFS link — this is what will be stored onchain.";
  }
  if (parsed.kind === "http") {
    return isCommitted
      ? "HTTP/HTTPS URL — stored as entered."
      : "HTTP/HTTPS URL.";
  }
  return undefined;
}
