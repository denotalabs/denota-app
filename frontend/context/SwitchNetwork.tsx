import {
  blockExplorerTxBasesFor,
  getChainConfigByHex,
  METAMASK_ERROR_CODE,
  rpcUrlsFor,
} from "./config/chains";

export const switchNetwork = async (chainId: string) => {
  const config = getChainConfigByHex(chainId);

  if (!config) {
    console.error(`Unsupported chain ID: ${chainId}`);
    return;
  }

  const { chain } = config;
  try {
    await window.ethereum?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId }],
    });
    return true;
  } catch (error: any) {
    if (error.code === METAMASK_ERROR_CODE) {
      try {
        await window.ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId,
              chainName: chain.name,
              nativeCurrency: chain.nativeCurrency,
              blockExplorerUrls: blockExplorerTxBasesFor(config),
              rpcUrls: rpcUrlsFor(config),
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error(addError);
        return false;
      }
    }
    return false;
  }
};
