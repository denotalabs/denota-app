/**
 * Storage & proof settings for a nota attachment: where the bytes live,
 * who can read them (encryption), and how they're proven (notarization).
 * Encryption is independent of the storage tier; encrypted bytes can be
 * posted on-chain as-is.
 */

export type StorageId = "ipfs" | "arweave" | "hosted" | "ethstorage" | "ethfs";

export interface StorageOption {
  id: StorageId;
  /** Outcome word shown on the tile. */
  title: string;
  /** True when bytes are written to chain state. */
  onchain: boolean;
  /** Underlying infrastructure plus tradeoffs. */
  helper: string;
  /** False while the backend for this tier isn't implemented (tile is disabled). */
  available: boolean;
}

export const STORAGE_OPTIONS: readonly StorageOption[] = [
  {
    id: "ipfs",
    title: "Durable",
    onchain: false,
    helper: "IPFS, peer-to-peer, durable while pinned, cheap. The default.",
    available: true,
  },
  {
    id: "arweave",
    title: "Permanent",
    onchain: false,
    helper: "Arweave, pay once, stored forever, off-chain.",
    available: false,
  },
  {
    id: "hosted",
    title: "Hosted",
    onchain: false,
    helper: "Denota storage, hosted blob, fast, lives while hosted.",
    available: false,
  },
  {
    id: "ethstorage",
    title: "On-chain",
    onchain: true,
    helper: "EthStorage, large files with on-chain proofs.",
    available: false,
  },
  {
    id: "ethfs",
    title: "Full L1",
    onchain: true,
    helper: "EthFS, fully self-contained in L1 state. Tiny files only.",
    available: false,
  },
];

export interface AttachmentStorageSettings {
  storage: StorageId;
  encrypted: boolean;
  notarized: boolean;
}

export const DEFAULT_ATTACHMENT_STORAGE_SETTINGS: AttachmentStorageSettings = {
  storage: "ipfs",
  encrypted: false,
  notarized: false,
};

const STORAGE_BY_ID = new Map(STORAGE_OPTIONS.map((option) => [option.id, option]));

export function getStorageOption(id: StorageId): StorageOption {
  return STORAGE_BY_ID.get(id) ?? STORAGE_OPTIONS[0];
}

export function isStorageId(value: unknown): value is StorageId {
  return typeof value === "string" && STORAGE_BY_ID.has(value as StorageId);
}

/**
 * Coerce a loosely typed value (e.g. from persisted form data) into valid
 * settings. Unknown or not-yet-available tiers fall back to the default.
 */
export function normalizeStorageSettings(
  value: unknown
): AttachmentStorageSettings {
  const raw = (value ?? {}) as Partial<Record<keyof AttachmentStorageSettings, unknown>>;
  const storage =
    isStorageId(raw.storage) && getStorageOption(raw.storage).available
      ? raw.storage
      : DEFAULT_ATTACHMENT_STORAGE_SETTINGS.storage;
  return {
    storage,
    encrypted: raw.encrypted === true,
    notarized: raw.notarized === true,
  };
}

/** Display chips for the current selection, e.g. ["Durable", "Public", "Standard"]. */
export function storageSettingsChips(
  settings: AttachmentStorageSettings
): string[] {
  return [
    getStorageOption(settings.storage).title,
    settings.encrypted ? "Encrypted" : "Public",
    settings.notarized ? "Notarized" : "Standard",
  ];
}

/** Inline sentence form, e.g. "Durable, public, standard". */
export function storageSettingsSummary(
  settings: AttachmentStorageSettings
): string {
  const [tier, ...rest] = storageSettingsChips(settings);
  return [tier, ...rest.map((chip) => chip.toLowerCase())].join(", ");
}
