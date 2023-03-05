import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import WalletConnectProvider from "@walletconnect/web3-provider";

// TODO: Add back wallet connect after setting up Infura account
export const providerOptions = {
  walletlink: {
    package: CoinbaseWalletSDK, // Required
    options: {
      appName: "CheqProtocol", // Required
      // infuraId: process.env.INFURA_KEY
    },
  },
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: process.env.NEXT_PUBLIC_INFURA_KEY,
    },
  },
};
