import { ethers } from "ethers";
import {
  classifyAccountInput,
  type AccountInputKind,
} from "../utils/accountIdentity";
import { useEnsAddress } from "./useEnsAddress";
import { usePrivyWallet } from "./usePrivyWallet";

export function useResolvedAccount(
  value: string | undefined,
  options?: { allowEns?: boolean }
): {
  address: string | null | undefined;
  isLoading: boolean;
  kind: AccountInputKind;
  didFail: boolean;
} {
  const trimmed = value?.trim() ?? "";
  const kind = classifyAccountInput(trimmed);
  const allowEns = options?.allowEns ?? true;
  const ensQuery = allowEns && kind === "ens" ? trimmed : undefined;
  const privyQuery =
    kind === "email" || kind === "phone" ? trimmed : undefined;

  const ens = useEnsAddress(ensQuery);
  const privy = usePrivyWallet(privyQuery);

  if (kind === "address") {
    return {
      address: ethers.utils.getAddress(trimmed),
      isLoading: false,
      kind,
      didFail: false,
    };
  }
  if (kind === "ens") {
    return {
      address: ens.address,
      isLoading: ens.isLoading,
      kind,
      didFail: false,
    };
  }
  if (kind === "email" || kind === "phone") {
    return {
      address: privy.address,
      isLoading: privy.isLoading,
      kind,
      didFail: privy.didFail,
    };
  }
  return { address: undefined, isLoading: false, kind, didFail: false };
}
