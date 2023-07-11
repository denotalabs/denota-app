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
  "0x13881": {
    displayName: "Polygon Mumbai",
    name: "Polygon Testnet Mumbai",
    chainId: "0x13881",
    logoSrc: "/logos/polygon-logo.svg",
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrls: ["https://mumbai.polygonscan.com/tx/"],
    rpcUrls: ["https://polygon-mumbai-bor.publicnode.com/"],
    graphUrl: "https://denota.klymr.me/graph/mumbai",
    graphTestUrl:
      "http://ec2-3-236-30-211.compute-1.amazonaws.com:8000/subgraphs/name/CheqRegistrar/mumbai",
  },
  "0xaef3": {
    name: "Celo Testnet Alfajores",
    displayName: "Celo Alfajores",
    chainId: "0xaef3",
    logoSrc: "/logos/celo-logo.svg",
    nativeCurrency: {
      name: "Celo",
      symbol: "CELO",
      decimals: 18,
    },
    blockExplorerUrls: ["https://alfajores-blockscout.celo-testnet.org/tx/"],
    rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
    graphUrl: "https://denota.klymr.me/graph/alfajores",
    graphTestUrl:
      "http://ec2-3-236-30-211.compute-1.amazonaws.com:8000/subgraphs/name/CheqRegistrar/alfajores",
  },
  "0x1": {
    isDisabled: true,
    name: "Ethereum Mainnet",
    displayName: "Ethereum",
    chainId: "0x1",
    logoSrc: "/logos/ethereum-logo.svg",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://etherscan.io/"],
    rpcUrls: ["https://eth.llamarpc.com"],
    graphUrl: "https://denota.klymr.me/graph/ethereum",
    graphTestUrl: "https://denota.klymr.me/graph/ethereum",
  },
  "0xAA36A7": {
    isDisabled: true,
    name: "Sepolia Test Netwok",
    displayName: "Ethereum Sepolia",
    chainId: "0xAA36A7",
    logoSrc: "/logos/ethereum-logo.svg",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://sepolia.etherscan.io/"],
    rpcUrls: ["https://ethereum-sepolia.blockpi.network/v1/rpc/public"],
    graphUrl: "https://denota.klymr.me/graph/ethereum",
    graphTestUrl: "https://denota.klymr.me/graph/ethereum",
  },
  "0x66EED": {
    isDisabled: true,
    name: "Arbitrum Test Netwok",
    displayName: "Arbitrum Goerli",
    chainId: "0x66EED",
    logoSrc: "/logos/arbitrum-logo.svg",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://goerli.arbiscan.io/"],
    rpcUrls: ["https://arbitrum-goerli.blockpi.network/v1/rpc/public"],
    graphUrl: "https://denota.klymr.me/graph/ethereum",
    graphTestUrl: "https://denota.klymr.me/graph/ethereum",
  },
  "0x14A33": {
    isDisabled: true,
    name: "Base Test Netwok",
    displayName: "Base Goerli",
    chainId: "0x14A33",
    logoSrc: "/logos/base-logo.svg",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://goerli.basescan.org/"],
    rpcUrls: ["https://goerli.base.org/"],
    graphUrl: "https://denota.klymr.me/graph/ethereum",
    graphTestUrl: "https://denota.klymr.me/graph/ethereum",
  },
  "0x1A4": {
    isDisabled: true,
    name: "Optimism Goerli",
    displayName: "Optimism",
    chainId: "0x1A4",
    logoSrc: "/logos/optimism-logo.svg",
    nativeCurrency: {
      name: "Optimism Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://goerli-optimistic.etherscan.io/"],
    rpcUrls: ["https://goerli.optimism.io/"],
    graphUrl: "",
    graphTestUrl: "",
  },
  "0x118": {
    isDisabled: true,
    name: "zkSync Era Testnet",
    displayName: "zkSync Era",
    chainId: "0x118",
    logoSrc: "/logos/zksync-logo.svg",
    nativeCurrency: {
      name: "zkSync Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: [""],
    rpcUrls: [""],
    graphUrl: "",
    graphTestUrl: "",
  },
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
    blockExplorerUrls: ["https://mumbai.polygonscan.com/tx/"],
    rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
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
      return undefined;
  }
};
