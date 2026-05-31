import { Image } from "@chakra-ui/react";
import {
  normalizeSymbol,
  useTokenList,
} from "../../context/TokenListProvider";

export type NotaCurrency =
  | "DAI"
  | "USDC"
  | "WETH"
  | "USDT"
  | "USDCE"
  | "UNKNOWN";

// The set of currencies the app supports writing with. The actual address /
// decimals / logo for each comes from the runtime token list. Arbitrary token
// support is gated on SDK changes (write() is symbol-based).
export const SUPPORTED_CURRENCIES: NotaCurrency[] = [
  "USDT",
  "USDC",
  "USDCE",
  "WETH",
];

// Every currency the app can recognize when reading tokens off-chain (a
// superset of SUPPORTED_CURRENCIES, which is only what we let users write).
const KNOWN_CURRENCIES = new Set<string>([
  "DAI",
  "USDC",
  "WETH",
  "USDT",
  "USDCE",
]);

/** Resolve a normalized token symbol to a NotaCurrency, or "UNKNOWN". */
export const currencyForSymbol = (normalizedSymbol: string): NotaCurrency =>
  KNOWN_CURRENCIES.has(normalizedSymbol)
    ? (normalizedSymbol as NotaCurrency)
    : "UNKNOWN";

// Symbols whose UI label differs from the NotaCurrency key.
const CURRENCY_DISPLAY_NAMES: Partial<Record<NotaCurrency, string>> = {
  USDCE: "USDC.e",
  UNKNOWN: "Unknown Token",
};

export const displayNameForCurrency = (currency: NotaCurrency): string =>
  CURRENCY_DISPLAY_NAMES[currency] ?? currency;

interface Props {
  currency: NotaCurrency;
}
// TODO the above minus NotaCurrency type is tech debt. Remove once SDK allows arbitrary tokens to be written.

function CurrencyIcon({ currency }: Props) {
  const { bySymbol } = useTokenList();
  const logoURI = bySymbol.get(normalizeSymbol(currency))?.logoURI;

  return logoURI ? (
    <Image boxSize="20px" src={logoURI} alt={currency} />
  ) : null;
}

export default CurrencyIcon;
