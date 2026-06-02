import { isAddress } from "ethers/lib/utils";
import { useMemo } from "react";
import { FormatAddressOptions, useFormatAddress } from "./useFormatAddress";
import { useEnsNames } from "./useEnsNames";

export function useDisplayAddress(
  address: string | null | undefined,
  options?: FormatAddressOptions,
  ensNames?: Map<string, string | null>
): string {
  const { formatAddress } = useFormatAddress();
  const localEnsNames = useEnsNames(ensNames ? [] : address ? [address] : []);
  const resolvedEnsNames = ensNames ?? localEnsNames;

  return useMemo(() => {
    if (!address || !isAddress(address)) {
      return address ?? "";
    }

    const ensName = resolvedEnsNames.get(address.toLowerCase());
    if (ensName) {
      return ensName;
    }

    return formatAddress(address, options);
  }, [address, formatAddress, options?.shorten, resolvedEnsNames]);
}
