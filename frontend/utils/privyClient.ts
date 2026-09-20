import { classifyAccountInput, normalizeEmail, normalizePhone } from "./accountIdentity";

const privyWalletCache = new Map<string, string | null>();
const pendingLookups = new Map<string, Promise<string | null>>();

function cacheKey(value: string): string | null {
  const kind = classifyAccountInput(value);
  if (kind === "email") {
    return `email:${normalizeEmail(value)}`;
  }
  if (kind === "phone") {
    return `phone:${normalizePhone(value)}`;
  }
  return null;
}

async function fetchPrivyWallet(value: string): Promise<string | null> {
  const response = await fetch("/api/privy/wallet/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value }),
  });

  if (!response.ok) {
    throw new Error(`Privy wallet lookup failed (${response.status})`);
  }

  const data = (await response.json()) as { address?: string | null };
  return data.address ?? null;
}

export async function lookupPrivyWallet(value: string): Promise<string | null> {
  const key = cacheKey(value);
  if (!key) {
    return null;
  }
  if (privyWalletCache.has(key)) {
    return privyWalletCache.get(key) ?? null;
  }

  let pending = pendingLookups.get(key);
  if (!pending) {
    pending = fetchPrivyWallet(value)
      .then((address) => {
        privyWalletCache.set(key, address);
        return address;
      })
      .finally(() => {
        pendingLookups.delete(key);
      });
    pendingLookups.set(key, pending);
  }
  return pending;
}
