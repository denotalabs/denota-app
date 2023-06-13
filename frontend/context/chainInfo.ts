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
    rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
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
};

export const batchContractMappingForChainId = (chainId: number) => {
  switch (chainId) {
    case 80001:
      return "0xa58AA04c66aF0e8A5B22e17a48EEA34405c526b5";
    default:
      return undefined;
  }
};
