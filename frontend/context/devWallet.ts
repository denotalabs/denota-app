// Anvil account #0 — only for local forks, never use with real funds.
export const ANVIL_DEFAULT_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export { ANVIL_CHAIN_ID } from "./config/chains";

export const isDevWalletEnabled = () =>
  process.env.NEXT_PUBLIC_DEV_WALLET === "true";

export const devWalletConfig = () => ({
  rpcUrl: process.env.NEXT_PUBLIC_DEV_RPC_URL ?? "http://127.0.0.1:8545",
  privateKey:
    process.env.NEXT_PUBLIC_DEV_PRIVATE_KEY ?? ANVIL_DEFAULT_PRIVATE_KEY,
});
