import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";

export interface FormatAddressOptions {
  /** When false, show the full address (still resolves connected wallet to "You"). Default true. */
  shorten?: boolean;
}

export const useFormatAddress = () => {
  const { blockchainState } = useBlockchainData();
  const formatAddress = useCallback(
    (adress: string, options?: FormatAddressOptions) => {
      if (adress.toLowerCase() === blockchainState.account.toLowerCase()) {
        return "You";
      }
      if (options?.shorten === false) {
        return adress;
      }
      return adress.slice(0, 5) + "..." + adress.slice(-4);
    },
    [blockchainState.account]
  );
  return { formatAddress };
};
