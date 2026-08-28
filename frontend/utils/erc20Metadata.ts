import { ethers } from "ethers";
import { polygon } from "viem/chains";

import { DEFAULT_CHAIN_ID, getChainConfig } from "../context/config/chains";
import type { TokenInfo } from "../context/config/tokenList";
import { truncateAddress } from "./address";

const ERC20_METADATA_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

const ERC20_BYTES32_METADATA_ABI = [
  "function name() view returns (bytes32)",
  "function symbol() view returns (bytes32)",
];

const providers = new Map<number, ethers.providers.StaticJsonRpcProvider>();

function rpcUrlForChain(chainId: number): string {
  const config = getChainConfig(chainId);
  const http = config?.chain.rpcUrls?.default?.http;
  if (http?.[0]) {
    return http[0];
  }
  return (
    process.env.NEXT_PUBLIC_POLYGON_RPC_URL?.trim() ||
    polygon.rpcUrls.default.http[0]
  );
}

function getReadProvider(
  chainId: number
): ethers.providers.StaticJsonRpcProvider {
  let provider = providers.get(chainId);
  if (!provider) {
    provider = new ethers.providers.StaticJsonRpcProvider(
      rpcUrlForChain(chainId)
    );
    providers.set(chainId, provider);
  }
  return provider;
}

export type Erc20MetadataResult =
  | { ok: true; token: TokenInfo }
  | { ok: false; error: string };

function decodeBytes32(value: string): string | null {
  try {
    const parsed = ethers.utils.parseBytes32String(value).replace(/\0/g, "");
    return parsed || null;
  } catch {
    return null;
  }
}

async function readMetadataString(
  address: string,
  provider: ethers.providers.Provider,
  method: "name" | "symbol"
): Promise<string | null> {
  const stringContract = new ethers.Contract(
    address,
    ERC20_METADATA_ABI,
    provider
  );
  try {
    const result: unknown = await stringContract[method]();
    if (typeof result === "string" && result.trim()) {
      if (result.startsWith("0x") && result.length === 66) {
        return decodeBytes32(result) ?? result;
      }
      return result.trim();
    }
  } catch {
    // Fall through to bytes32.
  }

  const bytesContract = new ethers.Contract(
    address,
    ERC20_BYTES32_METADATA_ABI,
    provider
  );
  try {
    const result: unknown = await bytesContract[method]();
    if (typeof result === "string") {
      return decodeBytes32(result);
    }
  } catch {
    return null;
  }
  return null;
}

async function readDecimals(
  address: string,
  provider: ethers.providers.Provider
): Promise<number> {
  const contract = new ethers.Contract(address, ERC20_METADATA_ABI, provider);
  try {
    const result: unknown = await contract.decimals();
    const n =
      typeof result === "number"
        ? result
        : ethers.BigNumber.isBigNumber(result)
          ? result.toNumber()
          : Number(result);
    if (Number.isInteger(n) && n >= 0 && n <= 255) {
      return n;
    }
  } catch {
    // Optional metadata; default below.
  }
  return 18;
}

/**
 * Read ERC-20 name/symbol/decimals. Missing optional metadata uses
 * shortened-address / 18-decimal fallbacks instead of throwing.
 */
export async function fetchErc20Metadata(
  rawAddress: string,
  chainId: number = DEFAULT_CHAIN_ID,
  provider?: ethers.providers.Provider | null
): Promise<Erc20MetadataResult> {
  let address: string;
  try {
    address = ethers.utils.getAddress(rawAddress);
  } catch {
    return { ok: false, error: "Invalid address checksum" };
  }

  const readProvider = provider ?? getReadProvider(chainId);

  try {
    const code = await readProvider.getCode(address);
    if (!code || code === "0x") {
      return { ok: false, error: "No contract at this address" };
    }
  } catch {
    return {
      ok: false,
      error: "Couldn't read this address. Check the network and try again.",
    };
  }

  const shortened = truncateAddress(address);
  try {
    const [name, symbol, decimals] = await Promise.all([
      readMetadataString(address, readProvider, "name"),
      readMetadataString(address, readProvider, "symbol"),
      readDecimals(address, readProvider),
    ]);

    return {
      ok: true,
      token: {
        chainId,
        address,
        name: name || shortened,
        symbol: symbol || shortened,
        decimals,
        tags: ["imported"],
      },
    };
  } catch {
    return {
      ok: false,
      error: "Couldn't read token metadata from this address.",
    };
  }
}
