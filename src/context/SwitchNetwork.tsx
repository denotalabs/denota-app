interface Network {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls: string[];
  rpcUrls: string[];
}

const networkForChainId = (chainId: string): Network | undefined => {
  switch (chainId) {
    case "0x13881":
      return {
        chainId,
        chainName: "Polygon Testnet Mumbai",
        nativeCurrency: {
          name: "Matic",
          symbol: "MATIC",
          decimals: 18,
        },
        blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
        rpcUrls: ["https://rpc-mumbai.maticvigil.com/"],
      };
    case "0xAEF3":
      return {
        chainId,
        chainName: "Celo Testnet Alfajores",
        nativeCurrency: {
          name: "Celo",
          symbol: "CELO",
          decimals: 18,
        },
        blockExplorerUrls: ["https://alfajores-blockscout.celo-testnet.org/"],
        rpcUrls: ["https://alfajores-forno.celo-testnet.org"],
      };
    default:
      return undefined;
  }
};

export const switchNetwork = async (chainId: string) => {
  const network = networkForChainId(chainId);

  if (!network) {
    console.error(`Unsupported chain ID: ${chainId}`);
    return;
  }

  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
  } catch (error: any) {
    if (error.code === 4902) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [network],
        });
      } catch (addError) {
        console.error(addError);
      }
    }
  }
};