import { deployedChains, METAMASK_ERROR_CODE } from "./chainInfo";

export const switchNetwork = async (chainId: string) => {
  const network = deployedChains[chainId];

  if (!network) {
    console.error(`Unsupported chain ID: ${chainId}`);
    return;
  }

  const {
    name,
    chainId: id,
    nativeCurrency,
    blockExplorerUrls,
    rpcUrls,
  } = network;
  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: id }],
    });
  } catch (error: any) {
    if (error.code === METAMASK_ERROR_CODE) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: id,
              chainName: name,
              nativeCurrency,
              blockExplorerUrls,
              rpcUrls,
            },
          ],
        });
      } catch (addError) {
        console.error(addError);
      }
    }
  }
};
