import { isAddress } from "ethers/lib/utils";

import { ipfsToHttpUrl } from "./ipfsGateway";
import { isIpfsCid } from "./metadataUri";

export interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: Array<TokenMetadataAttribute>;
  [key: string]: unknown;
}

/** Registrar / hook state duplicated in Current state — hide from metadata tags. */
export const TOKEN_URI_STATE_TRAITS = [
  "Token",
  "Currency",
  "Escrowed",
  "Escrow",
  "Value",
  "Hook Contract",
  "Hook",
  "Module",
  "Approved",
] as const;

export interface TokenMetadataAttribute {
  trait_type?: string;
  value?: string | number;
  display_type?: string;
}

const isHexAddress = (value: unknown): value is string =>
  typeof value === "string" && isAddress(value.trim());

/** Collect hex addresses from tokenURI metadata fields and attribute values. */
export const collectMetadataAddresses = (
  metadata: TokenMetadata | null | undefined
): string[] => {
  if (!metadata) {
    return [];
  }

  const seen = new Set<string>();
  const add = (value: unknown) => {
    if (!isHexAddress(value)) {
      return;
    }
    seen.add(value.trim().toLowerCase());
  };

  for (const attribute of metadata.attributes ?? []) {
    add(attribute.value);
  }

  for (const [key, value] of Object.entries(metadata)) {
    if (key === "attributes") {
      continue;
    }
    add(value);
  }

  return [...seen];
};

export const isMetadataAddressValue = isHexAddress;

const DATE_DISPLAY_TYPES = new Set(["date", "datetime"]);
const DATE_TRAIT_PATTERN = /(date|time|timestamp|deadline|expir)/i;

const isUnixTimestamp = (value: string | number): boolean => {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    return false;
  }
  // Seconds (2001–2286) or milliseconds (2001–2286 in ms range).
  return (
    (num >= 1_000_000_000 && num < 10_000_000_000) ||
    (num >= 1_000_000_000_000 && num < 10_000_000_000_000)
  );
};

/** The one timestamp format for nota metadata, shared by every surface. */
export const formatMetadataTimestamp = (date: Date): string =>
  date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** Format a metadata attribute value for display. */
export const formatMetadataAttributeValue = (
  attribute: TokenMetadataAttribute
): string => {
  const { value, display_type, trait_type } = attribute;
  if (value == null) {
    return "—";
  }

  const displayType = display_type?.toLowerCase();
  const isDateAttribute =
    (displayType && DATE_DISPLAY_TYPES.has(displayType)) ||
    (!!trait_type &&
      DATE_TRAIT_PATTERN.test(trait_type) &&
      isUnixTimestamp(value));

  if (!isDateAttribute) {
    return String(value);
  }

  const num = typeof value === "number" ? value : Number(value);
  const ms = num >= 1_000_000_000_000 ? num : num * 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return formatMetadataTimestamp(date);
};

export interface TokenUriOnChainFields {
  currency: string;
  escrowWei: string;
  hook: string;
}

export const getMetadataAttribute = (
  metadata: TokenMetadata | null | undefined,
  traitType: string
): string | null => {
  const attr = metadata?.attributes?.find(
    (a) => a.trait_type?.toLowerCase() === traitType.toLowerCase()
  );
  if (attr?.value == null) {
    return null;
  }
  return String(attr.value);
};

/** Parse a date/timestamp trait from tokenURI metadata (seconds or ms unix). */
export const getMetadataDateAttribute = (
  metadata: TokenMetadata | null | undefined,
  traitType: string
): Date | null => {
  if (!metadata?.attributes?.length) {
    return null;
  }
  const attr = metadata.attributes.find(
    (a) => a.trait_type?.toLowerCase() === traitType.toLowerCase()
  );
  if (attr?.value == null) {
    return null;
  }
  const displayType = attr.display_type?.toLowerCase();
  const isDateAttribute =
    (displayType && DATE_DISPLAY_TYPES.has(displayType)) ||
    (!!attr.trait_type &&
      DATE_TRAIT_PATTERN.test(attr.trait_type) &&
      isUnixTimestamp(attr.value));
  if (!isDateAttribute) {
    return null;
  }
  const num =
    typeof attr.value === "number" ? attr.value : Number(attr.value);
  const ms = num >= 1_000_000_000_000 ? num : num * 1000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const extractTokenUriOnChainFields = (
  metadata: TokenMetadata
): TokenUriOnChainFields | null => {
  const currency = getMetadataAttribute(metadata, "Token");
  const escrowWei = getMetadataAttribute(metadata, "Escrowed");
  const hook = getMetadataAttribute(metadata, "Hook Contract");
  if (!currency || !hook) {
    return null;
  }
  return {
    currency: currency.toLowerCase(),
    escrowWei: escrowWei ?? "0",
    hook,
  };
};

/** Metadata for display, without registrar state attributes. */
export const metadataWithoutStateAttributes = (
  metadata: TokenMetadata
): TokenMetadata => {
  if (!metadata.attributes?.length) {
    return metadata;
  }
  const attributes = metadata.attributes.filter(
    (a) =>
      !TOKEN_URI_STATE_TRAITS.some(
        (trait) => trait.toLowerCase() === a.trait_type?.toLowerCase()
      )
  );
  return {
    ...metadata,
    attributes: attributes.length > 0 ? attributes : undefined,
  };
};

/** Parse tokenURI data into a metadata object when possible. */
export const parseTokenMetadata = (uri: string): TokenMetadata | null => {
  try {
    const base64Marker = "base64,";
    const base64Index = uri.indexOf(base64Marker);
    if (base64Index >= 0) {
      const decoded = atob(uri.slice(base64Index + base64Marker.length));
      return JSON.parse(decoded) as TokenMetadata;
    }
    const utf8Marker = "utf8,";
    const utf8Index = uri.indexOf(utf8Marker);
    if (utf8Index >= 0) {
      return JSON.parse(uri.slice(utf8Index + utf8Marker.length)) as TokenMetadata;
    }
    if (uri.startsWith("{")) {
      return JSON.parse(uri) as TokenMetadata;
    }
    return null;
  } catch {
    return null;
  }
};

/** HTTP URL suitable for <img src> (IPFS → Pinata gateway). */
export const resolveMetadataImageUrl = (uri: string): string => {
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }
  if (uri.startsWith("ipfs://") || isIpfsCid(uri)) {
    return ipfsToHttpUrl(uri);
  }
  return uri;
};
