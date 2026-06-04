import type { ConnectedWallet } from "@privy-io/react-auth";

import {
  blockExplorerTxBasesFor,
  getChainConfigByHex,
  METAMASK_ERROR_CODE,
  rpcUrlsFor,
} from "./config/chains";

export const switchNetwork = async (
  chainIdHex: string,
  wallet?: ConnectedWallet
) => {
  const config = getChainConfigByHex(chainIdHex);

  if (!config) {
    console.error(`Unsupported chain ID: ${chainIdHex}`);
    return false;
  }

  const chainId = parseInt(chainIdHex, 16);

  if (wallet) {
    try {
      await wallet.switchChain(chainId);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  const { chain } = config;
  try {
    await window.ethereum?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (error: any) {
    if (error.code === METAMASK_ERROR_CODE) {
      try {
        await window.ethereum?.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
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
