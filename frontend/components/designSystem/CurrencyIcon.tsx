import { Image } from "@chakra-ui/react";
import {
  normalizeSymbol,
  useTokenList,
} from "../../context/TokenListProvider";

export type NotaCurrency =
  | "DAI"
  | "ETH"
  | "USDC"
  | "WETH"
  | "USDT"
  | "USDCE"
  | "UNKNOWN";

// The set of currencies the app supports writing with. The actual address /
// decimals / logo for each comes from the runtime token list. Arbitrary token
// support is gated on SDK changes (write() is symbol-based).
export const SUPPORTED_CURRENCIES: NotaCurrency[] = [
  "USDC",
  "WETH",
  "USDT",
  "DAI",
];

// Every currency the app can recognize when reading tokens off-chain (a
// superset of SUPPORTED_CURRENCIES, which is only what we let users write).
const KNOWN_CURRENCIES = new Set<string>([
  "DAI",
  "ETH",
  "USDC",
  "WETH",
  "USDT",
  "USDCE",
]);

/** On-chain / token-list symbol used to resolve metadata for a currency key. */
export const tokenListSymbolForCurrency = (currency: NotaCurrency): string => {
  if (currency === "UNKNOWN") {
    return "";
  }
  if (currency === "ETH") {
    return "WETH";
  }
  return normalizeSymbol(currency);
};

/** Symbol passed to the Denota SDK write() API. */
export const sdkCurrencyFor = (
  currency: NotaCurrency
): Exclude<NotaCurrency, "ETH" | "UNKNOWN"> | "WETH" => {
  if (currency === "ETH") {
    return "WETH";
  }
  return currency as Exclude<NotaCurrency, "ETH" | "UNKNOWN"> | "WETH";
};

/** Resolve a normalized token symbol to a NotaCurrency, or "UNKNOWN". */
export const currencyForSymbol = (normalizedSymbol: string): NotaCurrency => {
  const key = normalizedSymbol === "WETH" ? "ETH" : normalizedSymbol;
  return KNOWN_CURRENCIES.has(key) ? (key as NotaCurrency) : "UNKNOWN";
};

// Symbols whose UI label differs from the NotaCurrency key.
const CURRENCY_DISPLAY_NAMES: Partial<Record<NotaCurrency, string>> = {
  USDCE: "USDC.e",
  UNKNOWN: "Unknown Token",
};

export const displayNameForCurrency = (currency: NotaCurrency): string =>
  CURRENCY_DISPLAY_NAMES[currency] ?? currency;

// Curated icons for supported write currencies (and ETH/WETH). Other tokens use the
// runtime token list.
const DEFAULT_CURRENCY_LOGOS: Partial<Record<NotaCurrency, string>> = {
  USDC: "/logos/usdc.svg",
  USDT: "/logos/usdt.svg",
  DAI: "/logos/dai.svg",
  ETH: "/logos/weth.svg",
  WETH: "/logos/weth.svg",
};

interface Props {
  currency: NotaCurrency;
}
// TODO the above minus NotaCurrency type is tech debt. Remove once SDK allows arbitrary tokens to be written.

function CurrencyIcon({ currency }: Props) {
  const { bySymbol } = useTokenList();
  const logoURI =
    DEFAULT_CURRENCY_LOGOS[currency] ??
    bySymbol.get(normalizeSymbol(tokenListSymbolForCurrency(currency)))
      ?.logoURI;

  return logoURI ? (
    <Image
      boxSize="20px"
      minW="20px"
      borderRadius="full"
      objectFit="cover"
      src={logoURI}
      alt={currency}
    />
  ) : null;
}

export default CurrencyIcon;
