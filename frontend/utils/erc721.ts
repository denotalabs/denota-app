import { ethers } from "ethers";
import { polygon } from "viem/chains";

import { DEFAULT_CHAIN_ID, getChainConfig } from "../context/config/chains";

/** EIP-165 interface id: `bytes4(keccak256("ERC721"))` */
export const ERC721_INTERFACE_ID = "0x80ac58cd";

const ERC721_METADATA_ABI = [
  "function supportsInterface(bytes4 interfaceId) view returns (bool)",
  "function name() view returns (string)",
];

export interface Erc721ContractInfo {
  isErc721: boolean;
  name: string | null;
}

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

const providers = new Map<number, ethers.providers.StaticJsonRpcProvider>();

function getReadProvider(chainId: number): ethers.providers.StaticJsonRpcProvider {
  let provider = providers.get(chainId);
  if (!provider) {
    provider = new ethers.providers.StaticJsonRpcProvider(
      rpcUrlForChain(chainId)
    );
    providers.set(chainId, provider);
  }
  return provider;
}

/** ERC-721 check via EIP-165, plus optional collection `name()` when supported. */
export async function getErc721ContractInfo(
  address: string,
  chainId: number = DEFAULT_CHAIN_ID
): Promise<Erc721ContractInfo> {
  if (!ethers.utils.isAddress(address)) {
    return { isErc721: false, name: null };
  }

  const contract = new ethers.Contract(
    address,
    ERC721_METADATA_ABI,
    getReadProvider(chainId)
  );

  try {
    const isErc721 = Boolean(
      await contract.supportsInterface(ERC721_INTERFACE_ID)
    );
    if (!isErc721) {
      return { isErc721: false, name: null };
    }

    try {
      const rawName: string = await contract.name();
      const name = rawName?.trim() ? rawName.trim() : null;
      return { isErc721: true, name };
    } catch {
      return { isErc721: true, name: null };
    }
  } catch {
    return { isErc721: false, name: null };
  }
}
