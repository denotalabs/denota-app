import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

// TODO: Add back wallet connect after setting up Infura account
export const providerOptions = {
  walletlink: {
    package: CoinbaseWalletSDK, // Required
    options: {
      appName: "CheqProtocol", // Required
      // infuraId: process.env.INFURA_KEY
    },
  },
};
