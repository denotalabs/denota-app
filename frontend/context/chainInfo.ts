import { ContractAddressMapping } from "./contractAddresses";

export const MUMBAI_ADDRESS = "0x13881";
export const METAMASK_ERROR_CODE = 4902;

export const contractMappingForChainId = (chainId: number) => {
  switch (chainId) {
    case 80001:
      return ContractAddressMapping.mumbai;
    case 31337:
      return ContractAddressMapping.local;
    case 44787:
      return ContractAddressMapping.alfajores;
    default:
      return undefined;
  }
};

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
};
