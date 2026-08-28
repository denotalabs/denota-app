import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  readStoredCustomTokens,
  writeStoredCustomTokens,
} from "../utils/customTokens";
import { useBlockchainData } from "./BlockchainDataProvider";
import { DEFAULT_CHAIN_ID, getChainConfig } from "./config/chains";
import { TokenInfo } from "./config/tokenList";

// Normalize symbols so the app's currency keys (e.g. "USDCE") match hosted
// list symbols (e.g. "USDC.e").
export const normalizeSymbol = (symbol: string) =>
  symbol.toUpperCase().replace(/\./g, "");

interface TokenListContextValue {
  tokens: TokenInfo[];
  byAddress: Map<string, TokenInfo>;
  bySymbol: Map<string, TokenInfo>;
  isLoading: boolean;
  /** Lowercase addresses the user imported (not on the hosted/chain list). */
  importedAddresses: Set<string>;
  addCustomToken: (token: TokenInfo) => void;
}

const EMPTY_VALUE: TokenListContextValue = {
  tokens: [],
  byAddress: new Map(),
  bySymbol: new Map(),
  isLoading: false,
  importedAddresses: new Set(),
  addCustomToken: () => undefined,
};

const TokenListContext = createContext<TokenListContextValue>(EMPTY_VALUE);

// Per-chain cache of hosted + chain-config tokens (not user imports).
const tokenCache = new Map<number, TokenInfo[]>();

const mergeTokens = (
  hosted: TokenInfo[],
  custom: TokenInfo[]
): TokenInfo[] => {
  const byAddress = new Map<string, TokenInfo>();
  // Hosted first, then custom so local/test/imported tokens win on address collisions.
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
  const chainId = blockchainState.chainIdNumber || DEFAULT_CHAIN_ID;

  const [hostedTokens, setHostedTokens] = useState<TokenInfo[]>([]);
  const [importedTokens, setImportedTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!chainId) {
      setHostedTokens([]);
      setImportedTokens([]);
      return;
    }

    setImportedTokens(readStoredCustomTokens(chainId));

    const config = getChainConfig(chainId);
    // Hosted list fetch disabled; use chain-config tokens (USDC/USDT/WETH/DAI).
    // const tokenListUrl = config?.tokenListUrl;
    const customTokens = config?.customTokens ?? [];

    const cached = tokenCache.get(chainId);
    if (cached) {
      setHostedTokens(cached);
      setIsLoading(false);
      return;
    }

    const merged = mergeTokens([], customTokens);
    tokenCache.set(chainId, merged);
    setHostedTokens(merged);
    setIsLoading(false);

    // if (!tokenListUrl) {
    //   const merged = mergeTokens([], customTokens);
    //   tokenCache.set(chainId, merged);
    //   setHostedTokens(merged);
    //   setIsLoading(false);
    //   return;
    // }
    //
    // let cancelled = false;
    // setIsLoading(true);
    // fetch(tokenListUrl)
    //   .then((response) => response.json())
    //   .then((data) => {
    //     if (cancelled) {
    //       return;
    //     }
    //     const hosted = isTokenList(data)
    //       ? data.tokens.filter((token) => token.chainId === chainId)
    //       : [];
    //     const merged = mergeTokens(hosted, customTokens);
    //     tokenCache.set(chainId, merged);
    //     setHostedTokens(merged);
    //   })
    //   .catch((error) => {
    //     console.error("Failed to load token list", error);
    //     if (!cancelled) {
    //       setHostedTokens(mergeTokens([], customTokens));
    //     }
    //   })
    //   .finally(() => {
    //     if (!cancelled) {
    //       setIsLoading(false);
    //     }
    //   });
    //
    // return () => {
    //   cancelled = true;
    // };
  }, [chainId]);

  const addCustomToken = useCallback(
    (token: TokenInfo) => {
      const addr = token.address.toLowerCase();
      setImportedTokens((prev) => {
        const next = [
          ...prev.filter((item) => item.address.toLowerCase() !== addr),
          token,
        ];
        writeStoredCustomTokens(chainId, next);
        return next;
      });
    },
    [chainId]
  );

  const value = useMemo<TokenListContextValue>(() => {
    const tokens = mergeTokens(hostedTokens, importedTokens);
    const byAddress = new Map<string, TokenInfo>();
    const bySymbol = new Map<string, TokenInfo>();
    const importedAddresses = new Set(
      importedTokens.map((token) => token.address.toLowerCase())
    );

    // Index hosted symbols first so an imported fake can't overwrite USDC etc.
    hostedTokens.forEach((token) => {
      if (token.address) {
        byAddress.set(token.address.toLowerCase(), token);
        bySymbol.set(normalizeSymbol(token.symbol), token);
      }
    });
    importedTokens.forEach((token) => {
      if (token.address) {
        byAddress.set(token.address.toLowerCase(), token);
        const symbol = normalizeSymbol(token.symbol);
        if (!bySymbol.has(symbol)) {
          bySymbol.set(symbol, token);
        }
      }
    });

    return {
      tokens,
      byAddress,
      bySymbol,
      isLoading,
      importedAddresses,
      addCustomToken,
    };
  }, [addCustomToken, hostedTokens, importedTokens, isLoading]);

  return (
    <TokenListContext.Provider value={value}>
      {children}
    </TokenListContext.Provider>
  );
};

export const useTokenList = () => useContext(TokenListContext);
