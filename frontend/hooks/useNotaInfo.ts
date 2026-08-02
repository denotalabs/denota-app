import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { polygon } from "viem/chains";

import {
  DEFAULT_CHAIN_ID,
  getChainConfig,
} from "../context/config/chains";
import NotaRegistrar from "../frontend-abi/NotaRegistrar.json";
import {
  buildInteractionsFromSubgraph,
  dedupeInteractions,
  formatWeiAmount,
  NotaInteraction,
} from "../utils/notaInteractions";
import {
  metadataWithoutStateAttributes,
  parseTokenMetadata,
  TokenMetadata,
} from "../utils/notaTokenUri";
import {
  displayNameForCurrency as displayNameForCurrencyImpl,
  currencyForSymbol,
} from "../components/designSystem/CurrencyIcon";
import { normalizeSymbol } from "../context/TokenListProvider";
import { TokenInfo } from "../context/config/tokenList";
import {
  fetchNotaTokenUri,
  loadPolygonTokens,
  POLYGON_REGISTRAR_ADDRESS,
} from "./usePublicNotas";

const DEFAULT_DECIMALS = 18;

const GRAPH_QUERY_TIMEOUT_MS = 8_000;

const rpcUrl = () =>
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL?.trim() ||
  polygon.rpcUrls.default.http[0];

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

const queryWithTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Graph query timed out")),
      timeoutMs
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });

export interface NotaOnChainState {
  currency: string;
  currencySymbol: string;
  currencyDecimals: number;
  escrow: string;
  escrowWei: BigNumber;
  hook: string;
}

export interface NotaInfoData {
  owner: string | null;
  ownerLoading: boolean;
  approved: string | null;
  approvedLoading: boolean;
  onChainState: NotaOnChainState | null;
  onChainStateLoading: boolean;
  metadata: TokenMetadata | null;
  metadataLoading: boolean;
  interactions: NotaInteraction[];
  interactionsLoading: boolean;
  interactionsSource: "subgraph" | "none";
  notFound: boolean;
  error: string | null;
}

const emptyNotaInfoData = (): NotaInfoData => ({
  owner: null,
  ownerLoading: false,
  approved: null,
  approvedLoading: false,
  onChainState: null,
  onChainStateLoading: false,
  metadata: null,
  metadataLoading: false,
  interactions: [],
  interactionsLoading: false,
  interactionsSource: "none",
  notFound: false,
  error: null,
});

/** Subgraph is used only for the interaction history log, not live nota state. */
const NOTA_INTERACTIONS_QUERY = gql`
  query notaInteractions($id: ID!) {
    nota(id: $id) {
      id
      token {
        id
      }
      written {
        caller {
          id
        }
        owner {
          id
        }
        instant
        escrowed
        transaction {
          timestamp
          hash
        }
      }
      transfers {
        caller {
          id
        }
        from {
          id
        }
        to {
          id
        }
        transaction {
          timestamp
          hash
        }
      }
      funds {
        caller {
          id
        }
        escrow
        instant
        transaction {
          timestamp
          hash
        }
      }
      cashes {
        caller {
          id
        }
        to {
          id
        }
        escrow
        transaction {
          timestamp
          hash
        }
      }
      approvedEvents {
        caller {
          id
        }
        transaction {
          timestamp
          hash
        }
      }
      approvals {
        caller {
          id
        }
        owner {
          id
        }
        approved {
          id
        }
        transaction {
          timestamp
          hash
        }
      }
      burns {
        caller {
          id
        }
        to {
          id
        }
        transaction {
          timestamp
          hash
        }
      }
      updates {
        caller {
          id
        }
        transaction {
          timestamp
          hash
        }
      }
      metadataUpdates {
        caller {
          id
        }
        transaction {
          timestamp
          hash
        }
      }
    }
  }
`;

const tokenDisplayForAddress = (
  tokenAddress: string,
  polygonTokens: Map<string, TokenInfo>
): { decimals: number; symbol: string } => {
  const token = polygonTokens.get(tokenAddress.toLowerCase());
  if (!token) {
    return { decimals: DEFAULT_DECIMALS, symbol: "Unknown" };
  }
  const currencyKey = currencyForSymbol(normalizeSymbol(token.symbol));
  return {
    decimals: token.decimals ?? DEFAULT_DECIMALS,
    symbol: displayNameForCurrencyImpl(currencyKey),
  };
};

const buildOnChainStateFromInfo = (
  info: { escrowed: ethers.BigNumber; currency: string; module: string },
  polygonTokens: Map<string, TokenInfo>
): NotaOnChainState => {
  const currency = String(info.currency).toLowerCase();
  const { decimals, symbol } = tokenDisplayForAddress(currency, polygonTokens);
  return {
    currency,
    currencySymbol: symbol,
    currencyDecimals: decimals,
    escrow: ethers.utils.formatUnits(info.escrowed, decimals),
    escrowWei: info.escrowed,
    hook: String(info.module),
  };
};

export const useNotaInfo = (notaId: string | undefined) => {
  const [data, setData] = useState<NotaInfoData>(emptyNotaInfoData);

  const chainConfig = getChainConfig(DEFAULT_CHAIN_ID);
  const graphUrl = chainConfig?.graphUrl ?? "";

  const load = useCallback(() => {
    if (!notaId || notaId.trim() === "") {
      setData({
        ...emptyNotaInfoData(),
        notFound: true,
        error: "Invalid nota id",
      });
      return;
    }

    const id = notaId;
    const registrar = getRegistrarReadContract();
    const polygonTokensPromise = loadPolygonTokens();

    setData({
      ...emptyNotaInfoData(),
      ownerLoading: true,
      approvedLoading: true,
      onChainStateLoading: true,
      metadataLoading: true,
      interactionsLoading: !!graphUrl,
    });

    registrar
      .ownerOf(id)
      .then((owner) => {
        setData((prev) => ({
          ...prev,
          owner: String(owner),
          ownerLoading: false,
          notFound: false,
          error: null,
        }));
      })
      .catch((loadError) => {
        console.error("Failed to load payment owner", loadError);
        setData((prev) => ({
          ...prev,
          owner: null,
          ownerLoading: false,
          notFound: true,
          error: "Payment not found or failed to load",
        }));
      });

    registrar
      .getApproved(id)
      .then((approved) => {
        setData((prev) => ({
          ...prev,
          approved: String(approved),
          approvedLoading: false,
        }));
      })
      .catch((loadError) => {
        console.warn("Failed to load payment approved address", loadError);
        setData((prev) => ({
          ...prev,
          approved: null,
          approvedLoading: false,
        }));
      });

    polygonTokensPromise
      .then((polygonTokens) =>
        registrar.notaInfo(id).then((info: {
          escrowed: ethers.BigNumber;
          currency: string;
          module: string;
        }) => ({ info, polygonTokens }))
      )
      .then(({ info, polygonTokens }) => {
        setData((prev) => ({
          ...prev,
          onChainState: buildOnChainStateFromInfo(info, polygonTokens),
          onChainStateLoading: false,
        }));
      })
      .catch((loadError) => {
        console.warn("Failed to load payment on-chain state", loadError);
        setData((prev) => ({
          ...prev,
          onChainState: null,
          onChainStateLoading: false,
        }));
      });

    fetchNotaTokenUri(id)
      .then((tokenUri) => {
        const parsed = parseTokenMetadata(tokenUri);
        const metadata = parsed ? metadataWithoutStateAttributes(parsed) : null;

        setData((prev) => ({
          ...prev,
          metadata,
          metadataLoading: false,
        }));
      })
      .catch((loadError) => {
        console.warn("Failed to load payment tokenURI", loadError);
        setData((prev) => ({
          ...prev,
          metadata: null,
          metadataLoading: false,
        }));
      });

    if (!graphUrl) {
      return;
    }

    const client = new ApolloClient({
      uri: graphUrl,
      cache: new InMemoryCache(),
    });

    Promise.all([
      queryWithTimeout(
        client.query({
          query: NOTA_INTERACTIONS_QUERY,
          variables: { id },
        }),
        GRAPH_QUERY_TIMEOUT_MS
      ),
      polygonTokensPromise,
    ])
      .then(([result, polygonTokens]) => {
        const gqlNota = result.data?.nota;
        if (!gqlNota) {
          setData((prev) => ({
            ...prev,
            interactionsLoading: false,
            interactionsSource: "none",
          }));
          return;
        }

        const tokenAddress =
          gqlNota.token?.id?.toLowerCase() ??
          "";

        setData((prev) => ({
          ...prev,
          interactions: dedupeInteractions(
            buildInteractionsFromSubgraph(gqlNota, (value) => {
              const { decimals, symbol } = tokenDisplayForAddress(
                tokenAddress || prev.onChainState?.currency || "",
                polygonTokens
              );
              return formatWeiAmount(value, decimals, symbol);
            })
          ),
          interactionsLoading: false,
          interactionsSource: "subgraph",
        }));
      })
      .catch((graphError) => {
        console.warn("Subgraph payment query failed", graphError);
        setData((prev) => ({
          ...prev,
          interactionsLoading: false,
          interactionsSource: "none",
        }));
      });
  }, [graphUrl, notaId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      ...data,
      refresh: load,
    }),
    [data, load]
  );
};
