import { useCallback } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";

export const useCurrencyDisplayName = () => {
  const displayNameForCurrency = useCallback((currency: NotaCurrency) => {
    if (currency === "USDCE") {
      return "USDC.e";
    }
    return currency;
  }, []);

  return { displayNameForCurrency };
};
