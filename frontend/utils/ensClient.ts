import { getAddress, isAddress } from "viem";
import { normalizeEnsName } from "./ensAddress";

const ensCache = new Map<string, string | null>();
const ensAddressCache = new Map<string, string | null>();
const pendingBatches = new Map<string, Promise<void>>();
const pendingAddressBatches = new Map<string, Promise<void>>();

export function normalizeAddress(address: string): string | null {
  if (!isAddress(address)) {
    return null;
  }
  return getAddress(address).toLowerCase();
}

function uncachedAddresses(addresses: string[]): string[] {
  return [
    ...new Set(
      addresses
        .map(normalizeAddress)
        .filter(
          (address): address is string =>
            address !== null && !ensCache.has(address)
        )
    ),
  ];
}

async function fetchEnsNames(addresses: string[]): Promise<void> {
  const response = await fetch("/api/ens/names/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addresses }),
  });

  if (!response.ok) {
    throw new Error(`ENS lookup failed (${response.status})`);
  }

  const data = (await response.json()) as {
    names?: Record<string, string | null>;
  };

  for (const [address, name] of Object.entries(data.names ?? {})) {
    ensCache.set(address.toLowerCase(), name ?? null);
  }

  for (const address of addresses) {
    const normalized = normalizeAddress(address);
    if (normalized && !ensCache.has(normalized)) {
      ensCache.set(normalized, null);
    }
  }
}

export async function lookupEnsNames(
  addresses: string[]
): Promise<Map<string, string | null>> {
  const normalized = [
    ...new Set(
      addresses
        .map(normalizeAddress)
        .filter((address): address is string => address !== null)
    ),
  ];

  const toFetch = uncachedAddresses(normalized);
  if (toFetch.length > 0) {
    const batchKey = toFetch.sort().join(",");
    let pending = pendingBatches.get(batchKey);
    if (!pending) {
      pending = fetchEnsNames(toFetch).finally(() => {
        pendingBatches.delete(batchKey);
      });
      pendingBatches.set(batchKey, pending);
    }
    try {
      await pending;
    } catch {
      for (const address of toFetch) {
        ensCache.set(address, null);
      }
    }
  }

  const result = new Map<string, string | null>();
  for (const address of normalized) {
    result.set(address, ensCache.get(address) ?? null);
  }
  return result;
}

export function getCachedEnsName(address: string): string | null | undefined {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return undefined;
  }
  if (!ensCache.has(normalized)) {
    return undefined;
  }
  return ensCache.get(normalized) ?? null;
}

function uncachedEnsNames(names: string[]): string[] {
  return [
    ...new Set(
      names
        .map(normalizeEnsName)
        .filter(
          (name) => name.endsWith(".eth") && !ensAddressCache.has(name)
        )
    ),
  ];
}

async function fetchEnsAddresses(names: string[]): Promise<void> {
  const response = await fetch("/api/ens/address/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names }),
  });

  if (!response.ok) {
    throw new Error(`ENS address lookup failed (${response.status})`);
  }

  const data = (await response.json()) as {
    addresses?: Record<string, string | null>;
  };

  for (const [name, address] of Object.entries(data.addresses ?? {})) {
    ensAddressCache.set(name, address ?? null);
  }

  for (const name of names) {
    const normalized = normalizeEnsName(name);
    if (!ensAddressCache.has(normalized)) {
      ensAddressCache.set(normalized, null);
    }
  }
}

export async function lookupEnsAddress(name: string): Promise<string | null> {
  const results = await lookupEnsAddresses([name]);
  const normalized = normalizeEnsName(name);
  return results.get(normalized) ?? null;
}

export async function lookupEnsAddresses(
  names: string[]
): Promise<Map<string, string | null>> {
  const normalized = [
    ...new Set(
      names
        .map(normalizeEnsName)
        .filter((name) => name.endsWith(".eth"))
    ),
  ];

  const toFetch = uncachedEnsNames(normalized);
  if (toFetch.length > 0) {
    const batchKey = toFetch.sort().join(",");
    let pending = pendingAddressBatches.get(batchKey);
    if (!pending) {
      pending = fetchEnsAddresses(toFetch).finally(() => {
        pendingAddressBatches.delete(batchKey);
      });
      pendingAddressBatches.set(batchKey, pending);
    }
    try {
      await pending;
    } catch {
      for (const name of toFetch) {
        ensAddressCache.set(name, null);
      }
    }
  }

  const result = new Map<string, string | null>();
  for (const name of normalized) {
    result.set(name, ensAddressCache.get(name) ?? null);
  }
  return result;
}

export function getCachedEnsAddress(name: string): string | null | undefined {
  const normalized = normalizeEnsName(name);
  if (!normalized.endsWith(".eth")) {
    return undefined;
  }
  if (!ensAddressCache.has(normalized)) {
    return undefined;
  }
  return ensAddressCache.get(normalized) ?? null;
}
