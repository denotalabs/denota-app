// App-owned types for the "Token Lists" standard (https://tokenlists.org).
// The token *data* itself is fetched at runtime from a standard hosted token
// list, so we are not maintaining our own token registry here.

export interface TokenInfo {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: {
    readonly [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined;
  };
}

export interface TokenList {
  readonly name: string;
  readonly timestamp: string;
  readonly version: {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
  };
  readonly tokens: TokenInfo[];
  readonly logoURI?: string;
  readonly keywords?: string[];
}

/** Lightweight structural validation (avoids pulling in a JSON-schema validator). */
export const isTokenList = (value: unknown): value is TokenList => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const tokens = (value as { tokens?: unknown }).tokens;
  return (
    Array.isArray(tokens) &&
    tokens.every(
      (token) =>
        typeof token === "object" &&
        token !== null &&
        typeof (token as TokenInfo).address === "string" &&
        typeof (token as TokenInfo).chainId === "number" &&
        typeof (token as TokenInfo).decimals === "number" &&
        typeof (token as TokenInfo).symbol === "string"
    )
  );
};
