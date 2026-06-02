import {
  type Address,
  createPublicClient,
  getAddress,
  http,
  isAddress,
} from "viem";
import { mainnet } from "viem/chains";

let ensClient: ReturnType<typeof createPublicClient> | null = null;

function getMainnetRpcUrl(): string {
  return (
    process.env.ETHEREUM_RPC_URL ??
    process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL ??
    (process.env.INFURA_KEY || process.env.NEXT_PUBLIC_INFURA_KEY
      ? `https://mainnet.infura.io/v3/${
          process.env.INFURA_KEY ?? process.env.NEXT_PUBLIC_INFURA_KEY
        }`
      : "https://ethereum.publicnode.com")
  );
}

function getEnsClient() {
  if (ensClient) {
    return ensClient;
  }

  ensClient = createPublicClient({
    chain: mainnet,
    transport: http(getMainnetRpcUrl()),
  });

  return ensClient;
}

function normalizeAddress(address: string): string | null {
  if (!isAddress(address)) {
    return null;
  }
  return getAddress(address).toLowerCase();
}

export async function lookupEnsAddressServer(
  name: string
): Promise<string | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized.endsWith(".eth")) {
    return null;
  }

  try {
    const address = await getEnsClient().getEnsAddress({ name: normalized });
    if (!address) {
      return null;
    }
    return getAddress(address).toLowerCase();
  } catch {
    return null;
  }
}

export async function lookupEnsAddressesServer(
  names: string[]
): Promise<Record<string, string | null>> {
  const normalized = [
    ...new Set(
      names
        .map((name) => name.trim().toLowerCase())
        .filter((name) => name.endsWith(".eth"))
    ),
  ];

  const addresses: Record<string, string | null> = {};
  await Promise.all(
    normalized.map(async (name) => {
      addresses[name] = await lookupEnsAddressServer(name);
    })
  );

  return addresses;
}

export async function lookupEnsNamesServer(
  addresses: string[]
): Promise<Record<string, string | null>> {
  const normalized = [
    ...new Set(
      addresses
        .map(normalizeAddress)
        .filter((address): address is string => address !== null)
    ),
  ];

  const names: Record<string, string | null> = {};
  await Promise.all(
    normalized.map(async (address) => {
      try {
        const name = await getEnsClient().getEnsName({
          address: address as Address,
        });
        names[address] = name ?? null;
      } catch {
        names[address] = null;
      }
    })
  );

  return names;
}
