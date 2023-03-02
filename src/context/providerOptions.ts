import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

export const providerOptions = {
  walletlink: {
    package: CoinbaseWalletSDK, // Required
    options: {
      appName: "CheqProtocol", // Required
      // infuraId: process.env.INFURA_KEY
    },
  },
};
