import { getAddress, isAddress } from "viem";
import { classifyAccountInput, normalizeEmail, normalizePhone } from "./accountIdentity";

const PRIVY_API_URL = "https://api.privy.io";

type PrivyLinkedAccount = {
  type?: string;
  address?: string;
  chain_type?: string;
  wallet_client_type?: string;
};

type PrivyUser = {
  linked_accounts?: PrivyLinkedAccount[];
};

function getPrivyCredentials(): { appId: string; appSecret: string } | null {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ?? "";
  const appSecret = process.env.PRIVY_APP_SECRET?.trim() ?? "";
  if (!appId || !appSecret) {
    return null;
  }
  return { appId, appSecret };
}

function privyHeaders(appId: string, appSecret: string): HeadersInit {
  const basic = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  return {
    Authorization: `Basic ${basic}`,
    "privy-app-id": appId,
    "Content-Type": "application/json",
  };
}

function isEthereumAddressAccount(account: PrivyLinkedAccount): boolean {
  if (typeof account.address !== "string" || !isAddress(account.address)) {
    return false;
  }
  if (account.chain_type && account.chain_type !== "ethereum") {
    return false;
  }
  return (
    account.type === "wallet" ||
    account.type === "smart_wallet"
  );
}

function ethereumWalletFromUser(user: PrivyUser): string | null {
  const ethereum = (user.linked_accounts ?? []).filter(isEthereumAddressAccount);
  if (ethereum.length === 0) {
    return null;
  }
  const embedded = ethereum.find(
    (account) =>
      account.type === "wallet" &&
      (account.wallet_client_type === "privy" ||
        account.wallet_client_type === "privy-v2")
  );
  const chosen =
    embedded ??
    ethereum.find((account) => account.type === "wallet") ??
    ethereum[0];
  if (!chosen.address || !isAddress(chosen.address)) {
    return null;
  }
  return getAddress(chosen.address);
}

async function privyLookup(
  path: string,
  body: Record<string, string>
): Promise<PrivyUser | null> {
  const credentials = getPrivyCredentials();
  if (!credentials) {
    throw new Error("Privy is not configured");
  }

  const response = await fetch(`${PRIVY_API_URL}${path}`, {
    method: "POST",
    headers: privyHeaders(credentials.appId, credentials.appSecret),
    body: JSON.stringify(body),
  });

  if (response.status === 404) {
    return null;
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `Privy lookup unauthorized (${response.status}). Check PRIVY_APP_SECRET.`
    );
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Privy lookup failed (${response.status}): ${text}`);
  }

  return (await response.json()) as PrivyUser;
}

export async function lookupPrivyWalletServer(
  value: string
): Promise<string | null> {
  const kind = classifyAccountInput(value);
  if (kind === "email") {
    const email = normalizeEmail(value);
    if (!email) {
      return null;
    }
    const user = await privyLookup("/v1/users/email/address", {
      address: email,
    });
    return user ? ethereumWalletFromUser(user) : null;
  }
  if (kind === "phone") {
    const phone = normalizePhone(value);
    if (!phone) {
      return null;
    }
    const user = await privyLookup("/v1/users/phone/number", {
      number: phone,
    });
    return user ? ethereumWalletFromUser(user) : null;
  }
  return null;
}
