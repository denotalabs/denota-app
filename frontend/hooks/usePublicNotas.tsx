import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { polygon } from "viem/chains";

import { getChainConfig, POLYGON_CHAIN_ID } from "../context/config/chains";
import { isTokenList, TokenInfo } from "../context/config/tokenList";
import NotaRegistrar from "../frontend-abi/NotaRegistrar.json";

// Deployed NotaRegistrar (Polygon). Reads are wallet-free via a public RPC.
export const POLYGON_REGISTRAR_ADDRESS =
  "0x000000003C9C54B98C17F5A8B05ADca5B3B041eD";

const PAGE_SIZE = 10;
const DEFAULT_DECIMALS = 18;

const rpcUrl = () =>
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL?.trim() ||
  polygon.rpcUrls.default.http[0];

// Singleton read-only contract so we don't spin up a provider per render.
let readContract: ethers.Contract | null = null;
const getRegistrarReadContract = (): ethers.Contract => {
  if (!readContract) {
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl());
    readContract = new ethers.Contract(
      POLYGON_REGISTRAR_ADDRESS,
      NotaRegistrar.abi,
      provider
    );
  }
  return readContract;
};

/** Fetch a nota's tokenURI over RPC (no wallet required). */
export const fetchNotaTokenUri = async (notaId: string): Promise<string> =>
  await getRegistrarReadContract().tokenURI(notaId);

/** How many ERC721 notas `account` currently holds (via registrar.balanceOf). */
export const useAccountNotaBalance = (account: string) => {
  const [balance, setBalance] = useState<number | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!account) {
      setBalance(undefined);
      return;
    }
    setBalance(undefined);
    try {
      const registrar = getRegistrarReadContract();
      const balanceBn: ethers.BigNumber = await registrar.balanceOf(account);
      setBalance(balanceBn.toNumber());
    } catch (e) {
      console.error("Failed to read nota balance", e);
      setBalance(0);
    }
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    balance,
    isCheckingBalance: !!account && balance === undefined,
    refresh,
  };
};

// Polygon token list cached at module scope so the landing page loads it once.
let polygonTokensCache: Map<string, TokenInfo> | null = null;
const loadPolygonTokens = async (): Promise<Map<string, TokenInfo>> => {
  if (polygonTokensCache) {
    return polygonTokensCache;
  }
  const map = new Map<string, TokenInfo>();
  const url = getChainConfig(POLYGON_CHAIN_ID)?.tokenListUrl;
  if (url) {
    try {
      const data = await (await fetch(url)).json();
      if (isTokenList(data)) {
        data.tokens
          .filter((token) => token.chainId === POLYGON_CHAIN_ID)
          .forEach((token) => map.set(token.address.toLowerCase(), token));
      }
    } catch (error) {
      console.error("Failed to load Polygon token list", error);
    }
  }
  polygonTokensCache = map;
  return map;
};

export interface NotaRow {
  notaId: string;
  owner: string;
  currency: string;
  escrow: string;
  hook: string;
}

export const usePublicNotas = () => {
  // page 0 = most recent PAGE_SIZE notas, page 1 = the previous PAGE_SIZE, ...
  const [page, setPage] = useState(0);
  const [notas, setNotas] = useState<NotaRow[] | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async (pageToLoad: number) => {
    setError(null);
    // Keep the current rows visible while the next page loads (no spinner
    // flash); they get swapped out once the new page is ready.
    setIsLoading(true);
    try {
      const registrar = getRegistrarReadContract();
      const totalBn: ethers.BigNumber = await registrar.totalSupply();
      const totalCount = totalBn.toNumber();
      setTotal(totalCount);

      if (totalCount <= 0) {
        setNotas([]);
        return;
      }

      const tokens = await loadPolygonTokens();

      // Ids are 0-indexed (first nota minted to id 0), so the most recent is
      // totalSupply - 1. Each page walks PAGE_SIZE ids further back.
      const highest = totalCount - 1 - pageToLoad * PAGE_SIZE;
      if (highest < 0) {
        setNotas([]);
        return;
      }

      const ids: number[] = [];
      for (let id = highest; id >= 0 && ids.length < PAGE_SIZE; id--) {
        ids.push(id);
      }

      const [infos, owners] = await Promise.all([
        Promise.allSettled(ids.map((id) => registrar.notaInfo(id))),
        Promise.allSettled(ids.map((id) => registrar.ownerOf(id))),
      ]);

      const rows: NotaRow[] = [];
      infos.forEach((result, index) => {
        // Burned / non-existent notas revert (NonExistent); skip them.
        if (result.status !== "fulfilled") {
          return;
        }
        const info = result.value;
        const ownerResult = owners[index];
        const owner =
          ownerResult.status === "fulfilled" ? String(ownerResult.value) : "";
        const token = tokens.get(String(info.currency).toLowerCase());
        const decimals = token?.decimals ?? DEFAULT_DECIMALS;
        rows.push({
          notaId: String(ids[index]),
          owner,
          currency: token?.symbol ?? "Unknown",
          escrow: ethers.utils.formatUnits(info.escrowed, decimals),
          hook: info.module,
        });
      });

      setNotas(rows);
    } catch (e) {
      console.error("Failed to load public notas", e);
      setError("Failed to load recent notas");
      setNotas([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const hasNewer = page > 0;
  const hasOlder = (page + 1) * PAGE_SIZE < total;

  return {
    notas,
    error,
    page,
    isLoading,
    hasNewer,
    hasOlder,
    showNewer: () => setPage((p) => Math.max(0, p - 1)),
    showOlder: () => setPage((p) => p + 1),
    refresh: () => load(page),
  };
};
