import { type Chain, defineChain } from "viem";
import { mainnet, polygon } from "viem/chains";
import type { TokenInfo } from "./tokenList";

export const POLYGON_CHAINID = "0x89";
export const METAMASK_ERROR_CODE = 4902;

export const ETHEREUM_MAINNET_CHAIN_ID = mainnet.id;
export const POLYGON_CHAIN_ID = polygon.id;
export const ANVIL_CHAIN_ID = 31337;

/** Chain used for token metadata and UI when no wallet is connected. */
export const DEFAULT_CHAIN_ID = POLYGON_CHAIN_ID;

const envValue = (key: string, fallback = "") =>
  process.env[key]?.trim() || fallback;

const POLYGON_GRAPH_URL = envValue(
  "NEXT_PUBLIC_POLYGON_GRAPH_URL",
  "https://subgraph.satsuma-prod.com/7be75cb990f3/alexs-team--3065096/denota/version/v0.0.3-new-version/api"
);

const ANVIL_RPC_URL = envValue(
  "NEXT_PUBLIC_DEV_RPC_URL",
  "http://127.0.0.1:8545"
);

// Local Anvil dev chain. Not part of viem/chains, so defined inline.
export const anvilChain = defineChain({
  id: ANVIL_CHAIN_ID,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [ANVIL_RPC_URL] } },
});

// const UNISWAP_TOKEN_LIST = "https://tokens.uniswap.org";

// Polygon write tokens. Addresses match @denota-labs/denota-sdk chainInfo.
const polygonCustomTokens = (): TokenInfo[] => [
  {
    chainId: POLYGON_CHAIN_ID,
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logoURI: "/logos/usdc.svg",
  },
  {
    chainId: POLYGON_CHAIN_ID,
    address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    logoURI: "/logos/weth.svg",
  },
  {
    chainId: POLYGON_CHAIN_ID,
    address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    logoURI: "/logos/usdt.svg",
  },
  {
    chainId: POLYGON_CHAIN_ID,
    address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    logoURI: "/logos/dai.svg",
  },
];

// Test tokens deployed locally to Anvil are sourced from env (no hosted list).
const anvilCustomTokens = (): TokenInfo[] => {
  const defs: Array<{
    symbol: string;
    name: string;
    decimals: number;
    envKey: string;
  }> = [
      { symbol: "DAI", name: "Dai Stablecoin", decimals: 18, envKey: "NEXT_PUBLIC_ANVIL_DAI" },
      { symbol: "WETH", name: "Wrapped Ether", decimals: 18, envKey: "NEXT_PUBLIC_ANVIL_WETH" },
      { symbol: "USDC", name: "USD Coin", decimals: 6, envKey: "NEXT_PUBLIC_ANVIL_USDC" },
      { symbol: "USDC.e", name: "Bridged USD Coin", decimals: 6, envKey: "NEXT_PUBLIC_ANVIL_USDCE" },
      { symbol: "USDT", name: "Tether USD", decimals: 6, envKey: "NEXT_PUBLIC_ANVIL_USDT" },
    ];
  return defs
    .map((d) => ({
      chainId: ANVIL_CHAIN_ID,
      address: envValue(d.envKey),
      name: d.name,
      symbol: d.symbol,
      decimals: d.decimals,
    }))
    .filter((token) => token.address !== "");
};

export interface DenotaChainConfig {
  chain: Chain;
  /** Human-friendly label used in the UI (may differ from chain.name). */
  displayName: string;
  /** Path to the chain logo asset. */
  logoSrc: string;
  /** Subgraph endpoint for this chain. */
  graphUrl: string;
  /** Optional local subgraph endpoint used during development. */
  graphTestUrl?: string;
  /** Uniswap-format token list fetched at runtime for this chain. */
  tokenListUrl?: string;
  /** Tokens not available on the hosted list (e.g. local test tokens). */
  customTokens?: TokenInfo[];
  /** MultiDisperse batch contract for this chain, if deployed. */
  batchAddress?: string;
  isTestnet?: boolean;
  isDisabled?: boolean;
}

export const DENOTA_CHAINS: Record<number, DenotaChainConfig> = {
  [POLYGON_CHAIN_ID]: {
    chain: polygon,
    displayName: "Polygon",
    logoSrc: "/logos/polygon-logo.svg",
    graphUrl: POLYGON_GRAPH_URL,
    graphTestUrl: envValue("NEXT_PUBLIC_POLYGON_GRAPH_TEST_URL"),
    // tokenListUrl: UNISWAP_TOKEN_LIST,
    customTokens: polygonCustomTokens(),
    batchAddress: "0x657eb9F744E49e6b31c42335C1662287d34465D4",
  },
  // [ETHEREUM_MAINNET_CHAIN_ID]: {
  //   chain: mainnet,
  //   displayName: "Ethereum",
  //   logoSrc: "/logos/ethereum-logo.svg",
  //   graphUrl: envValue("NEXT_PUBLIC_ETHEREUM_GRAPH_URL"),
  //   tokenListUrl: UNISWAP_TOKEN_LIST,
  // },
  // [ANVIL_CHAIN_ID]: {
  //   chain: anvilChain,
  //   displayName: "Anvil",
  //   logoSrc: "/logos/ethereum-logo.svg",
  //   graphUrl: envValue("NEXT_PUBLIC_ANVIL_GRAPH_URL"),
  //   customTokens: anvilCustomTokens(),
  //   isTestnet: true,
  // },
};

export const getChainConfig = (
  chainId: number
): DenotaChainConfig | undefined => DENOTA_CHAINS[chainId];

export const chainNumberToChainHex = (chainId: number) =>
  "0x" + chainId.toString(16);

export const batchContractMappingForChainId = (chainId: number) =>
  getChainConfig(chainId)?.batchAddress ?? "";

export const chainNumberForChainName = (chainName: string) => {
  switch (chainName.toUpperCase()) {
    case "ETH":
    case "ETHEREUM":
    case "MAINNET":
      return ETHEREUM_MAINNET_CHAIN_ID;
    case "POLYGON":
      return POLYGON_CHAIN_ID;
    case "ANVIL":
      return ANVIL_CHAIN_ID;
    default:
      return 0;
  }
};

export const getChainConfigByHex = (
  chainIdHex: string
): DenotaChainConfig | undefined =>
  Object.values(DENOTA_CHAINS).find(
    (config) => chainNumberToChainHex(config.chain.id) === chainIdHex
  );

/** RPC URLs for a chain as a mutable string array (wallet APIs expect this). */
export const rpcUrlsFor = (config: DenotaChainConfig): string[] => [
  ...config.chain.rpcUrls.default.http,
];

/** Block-explorer transaction-link bases for a chain (empty if none). */
export const blockExplorerTxBasesFor = (config: DenotaChainConfig): string[] =>
  config.chain.blockExplorers
    ? [`${config.chain.blockExplorers.default.url}/tx/`]
    : [];

const POLYGONSCAN_TX_BASE = "https://polygonscan.com/tx/";

/** Block-explorer base URL derived from a `/tx/` explorer link base. */
export const blockExplorerBaseFromTxBase = (explorerTxBase: string): string =>
  explorerTxBase.replace(/\/tx\/?$/, "");

/** Polygonscan (or chain explorer) address page for copy/link. */
export const blockExplorerAddressUrl = (
  explorerTxBase: string,
  address: string
): string =>
  `${blockExplorerBaseFromTxBase(explorerTxBase || POLYGONSCAN_TX_BASE)}/address/${address}`;

/** Polygonscan contract tab (verified source) for hook addresses. */
export const blockExplorerContractCodeUrl = (
  explorerTxBase: string,
  address: string
): string => `${blockExplorerAddressUrl(explorerTxBase, address)}#code`;
