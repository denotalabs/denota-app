import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import WalletConnectProvider from "@walletconnect/web3-provider";

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
      infuraId: "", // required
    },
  },
};
