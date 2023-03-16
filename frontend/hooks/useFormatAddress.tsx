import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";

export const useFormatAddress = () => {
  const { blockchainState } = useBlockchainData();
  const formatAddress = useCallback(
    (adress: string) => {
      if (adress.toLowerCase() === blockchainState.account.toLowerCase()) {
        return "You";
      }
      return adress.slice(0, 5) + "..." + adress.slice(-4);
    },
    [blockchainState.account]
  );
  return { formatAddress };
};
