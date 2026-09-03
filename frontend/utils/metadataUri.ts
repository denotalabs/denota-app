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

/** CID from a gateway URL plus the path/query that follows it. */
function extractCidFromGatewayUrl(
  value: string
): { cid: string; suffix: string } | null {
  const match = /\/ipfs\/([^/?#]+)/i.exec(value);
  const cid = match?.[1]?.trim();
  if (!match || !cid || !isIpfsCid(cid)) {
    return null;
  }
  return { cid, suffix: value.slice(match.index + match[0].length) };
}

/** Classify a metadata URI and produce the normalized onchain value. */
export function parseMetadataUri(input: string): ParsedMetadataUri {
  const trimmed = input.trim();
  if (!trimmed) {
    return { kind: "empty", normalized: "", cid: null };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const gateway = extractCidFromGatewayUrl(trimmed);
    if (gateway) {
      return {
        kind: "gateway",
        normalized: `ipfs://${gateway.cid}${gateway.suffix}`,
        cid: gateway.cid,
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
