import { ethers } from "ethers";
import { classifyAccountInput } from "./accountIdentity";
import { lookupEnsAddress } from "./ensClient";
import { lookupPrivyWallet } from "./privyClient";

export async function lookupAccountAddress(
  value: string
): Promise<string | null> {
  const kind = classifyAccountInput(value);
  if (kind === "address") {
    return ethers.utils.getAddress(value.trim());
  }
  if (kind === "ens") {
    return lookupEnsAddress(value);
  }
  if (kind === "email" || kind === "phone") {
    return lookupPrivyWallet(value);
  }
  return null;
}
