import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getChainConfig } from "./config/chains";
import { isTokenList, TokenInfo } from "./config/tokenList";
import { useBlockchainData } from "./BlockchainDataProvider";

// Normalize symbols so the app's currency keys (e.g. "USDCE") match hosted
// list symbols (e.g. "USDC.e").
export const normalizeSymbol = (symbol: string) =>
  symbol.toUpperCase().replace(/\./g, "");

interface TokenListContextValue {
  tokens: TokenInfo[];
  byAddress: Map<string, TokenInfo>;
  bySymbol: Map<string, TokenInfo>;
  isLoading: boolean;
}

const EMPTY_VALUE: TokenListContextValue = {
  tokens: [],
  byAddress: new Map(),
  bySymbol: new Map(),
  isLoading: false,
};

const TokenListContext = createContext<TokenListContextValue>(EMPTY_VALUE);

// Per-chain cache shared across mounts so we don't refetch the hosted list.
const tokenCache = new Map<number, TokenInfo[]>();

const mergeTokens = (
  hosted: TokenInfo[],
  custom: TokenInfo[]
): TokenInfo[] => {
  const byAddress = new Map<string, TokenInfo>();
  // Hosted first, then custom so local/test tokens win on address collisions.
  [...hosted, ...custom].forEach((token) => {
    if (token.address) {
      byAddress.set(token.address.toLowerCase(), token);
    }
  });
  return Array.from(byAddress.values());
};

export const TokenListProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { blockchainState } = useBlockchainData();
  const chainId = blockchainState.chainIdNumber;

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!chainId) {
      setTokens([]);
      return;
    }

    const config = getChainConfig(chainId);
    const tokenListUrl = config?.tokenListUrl;
    const customTokens = config?.customTokens ?? [];

    const cached = tokenCache.get(chainId);
    if (cached) {
      setTokens(cached);
      return;
    }

    if (!tokenListUrl) {
      const merged = mergeTokens([], customTokens);
      tokenCache.set(chainId, merged);
      setTokens(merged);
      return;
    }

    setIsLoading(true);
    fetch(tokenListUrl)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) {
          return;
        }
        const hosted = isTokenList(data)
          ? data.tokens.filter((token) => token.chainId === chainId)
          : [];
        const merged = mergeTokens(hosted, customTokens);
        tokenCache.set(chainId, merged);
        setTokens(merged);
      })
      .catch((error) => {
        console.error("Failed to load token list", error);
        if (!cancelled) {
          // Fall back to whatever local tokens we have for the chain.
          setTokens(mergeTokens([], customTokens));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chainId]);

  const value = useMemo<TokenListContextValue>(() => {
    const byAddress = new Map<string, TokenInfo>();
    const bySymbol = new Map<string, TokenInfo>();
    tokens.forEach((token) => {
      byAddress.set(token.address.toLowerCase(), token);
      bySymbol.set(normalizeSymbol(token.symbol), token);
    });
    return { tokens, byAddress, bySymbol, isLoading };
  }, [tokens, isLoading]);

  return (
    <TokenListContext.Provider value={value}>
      {children}
    </TokenListContext.Provider>
  );
};

export const useTokenList = () => useContext(TokenListContext);
