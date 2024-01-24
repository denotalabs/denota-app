export const MUMBAI_ADDRESS = "0x13881";
export const METAMASK_ERROR_CODE = 4902;

export interface ChainInfo {
  displayName: string;
  name: string;
  chainId: string;
  logoSrc: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  isDisabled?: boolean;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
  graphUrl: string;
  graphTestUrl: string;
}

export const chainNumberToChainHex = (chainId: number) => {
  return "0x" + chainId.toString(16);
};

export const chainInfoForChainId = (chainId: number) => {
  return deployedChains["0x" + chainId.toString(16)];
};

export const deployedChains: Record<string, ChainInfo> = {
  "0x89": {
    isDisabled: true,
    displayName: "Polygon",
    name: "Polygon",
    chainId: "0x89",
    logoSrc: "/logos/polygon-logo.svg",
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrls: ["https://polygonscan.com/tx/"],
    rpcUrls: ["https://polygon-rpc.com/"],
    graphUrl: "https://denota.klymr.me/graph/mumbai",
    graphTestUrl:
      "http://ec2-3-236-30-211.compute-1.amazonaws.com:8000/subgraphs/name/CheqRegistrar/mumbai",
  },
};

export const chainNumberForChainName = (chainName: string) => {
  const chainNameUpperCase = chainName.toUpperCase();
  switch (chainNameUpperCase) {
    case "ETH":
      return 1;
    case "ETHEREUM":
      return 1;
    case "MAINNET":
      return 1;
    case "POLYGON":
      return 137;
    default:
      return 0;
  }
};

export const batchContractMappingForChainId = (chainId: number) => {
  switch (chainId) {
    case 80001:
      return "0xa58AA04c66aF0e8A5B22e17a48EEA34405c526b5";
    case 137:
      return "0x657eb9F744E49e6b31c42335C1662287d34465D4";
    default:
      return "";
  }
};
