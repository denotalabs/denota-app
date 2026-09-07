import { ethers } from "ethers";
import { polygon } from "viem/chains";

import NotaRegistrar from "../frontend-abi/NotaRegistrar.json";

// Deployed NotaRegistrar (Polygon). Reads are wallet-free via a public RPC.
export const POLYGON_REGISTRAR_ADDRESS =
  "0x000000003C9C54B98C17F5A8B05ADca5B3B041eD";

const rpcUrl = () =>
  process.env.NEXT_PUBLIC_POLYGON_RPC_URL?.trim() ||
  polygon.rpcUrls.default.http[0];

// Singleton read-only contract so we don't spin up a provider per render.
let readContract: ethers.Contract | null = null;
export const getRegistrarReadContract = (): ethers.Contract => {
  if (!readContract) {
    const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl());
    readContract = new ethers.Contract(
      POLYGON_REGISTRAR_ADDRESS,
      NotaRegistrar.abi,
      provider
    );
  }
  return readContract;
};

/** Fetch a nota's tokenURI over RPC (no wallet required). */
export const fetchNotaTokenUri = async (notaId: string): Promise<string> =>
  await getRegistrarReadContract().tokenURI(notaId);
