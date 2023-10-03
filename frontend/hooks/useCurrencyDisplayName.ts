import { useCallback } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";

export const useCurrencyDisplayName = () => {
  const displayNameForCurrency = useCallback(
    (currency: NotaCurrency, sourceChainId?: string) => {
      return currency;
    },
    []
  );

  return { displayNameForCurrency };
};
