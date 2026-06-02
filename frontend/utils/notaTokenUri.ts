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

/** Format a metadata attribute value for display (ISO 8601 for dates/timestamps). */
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
  return date.toISOString();
};

export interface TokenUriOnChainFields {
  currency: string;
  escrowWei: string;
  hook: string;
}

export const getMetadataAttribute = (
  metadata: TokenMetadata,
  traitType: string
): string | null => {
  const attr = metadata.attributes?.find(
    (a) => a.trait_type?.toLowerCase() === traitType.toLowerCase()
  );
  if (attr?.value == null) {
    return null;
  }
  return String(attr.value);
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

/** Decode a registrar tokenURI into pretty-printed JSON text. */
export const decodeTokenUri = (uri: string): string => {
  try {
    const parsed = parseTokenMetadata(uri);
    if (parsed) {
      return JSON.stringify(parsed, null, 2);
    }
    return uri;
  } catch {
    return uri;
  }
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

export const truncateAddress = (address: string): string =>
  address && address.length > 10
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;
