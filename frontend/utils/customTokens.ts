import type { TokenInfo } from "../context/config/tokenList";

const storageKey = (chainId: number) => `denota.customTokens.v1.${chainId}`;

const isStoredToken = (value: unknown): value is TokenInfo => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const token = value as TokenInfo;
  return (
    typeof token.address === "string" &&
    typeof token.chainId === "number" &&
    typeof token.decimals === "number" &&
    typeof token.symbol === "string" &&
    typeof token.name === "string"
  );
};

/** User-imported ERC-20s persisted per chain. Safe to call on the server (returns []). */
export function readStoredCustomTokens(chainId: number): TokenInfo[] {
  if (typeof window === "undefined" || !chainId) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKey(chainId));
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isStoredToken);
  } catch {
    return [];
  }
}

export function writeStoredCustomTokens(
  chainId: number,
  tokens: TokenInfo[]
): void {
  if (typeof window === "undefined" || !chainId) {
    return;
  }
  window.localStorage.setItem(storageKey(chainId), JSON.stringify(tokens));
}
