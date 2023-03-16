import { useCallback } from "react";
import { CheqCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";

export const useCurrencyDisplayName = () => {
  const { blockchainState } = useBlockchainData();

  const displayNameForCurrency = useCallback(
    (currency: CheqCurrency) => {
      if (currency === "NATIVE") {
        return blockchainState.nativeCurrenySymbol;
      }
      return currency;
    },
    [blockchainState.nativeCurrenySymbol]
  );

  return { displayNameForCurrency };
};
