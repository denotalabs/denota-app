import { useCallback } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";

export const useCurrencyDisplayName = () => {
  const displayNameForCurrency = useCallback((currency: NotaCurrency) => {
    switch (currency) {
      case "USDCE":
        return "USDC.e";
      case "UNKNOWN":
        return "Unknown Token";
    }
    return currency;
  }, []);

  return { displayNameForCurrency };
};
