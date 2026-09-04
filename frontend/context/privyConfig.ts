import type { PrivyClientConfig } from "@privy-io/react-auth";
import { polygon } from "viem/chains";

import { DEFAULT_CHAIN_ID, DENOTA_CHAINS } from "./config/chains";

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

export const privySupportedChains = Object.values(DENOTA_CHAINS).map(
  (c) => c.chain
);

export const privyDefaultChain =
  DENOTA_CHAINS[DEFAULT_CHAIN_ID]?.chain ?? polygon;

export const privyConfig: PrivyClientConfig = {
  appearance: {
    theme: "light",
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",
    },
  },
  defaultChain: privyDefaultChain,
  supportedChains: privySupportedChains,
  loginMethods: ["sms", "email", "google", "wallet"]
};
