import { useEffect, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useTokens } from "./useTokens";

/**
 * Connected wallet's balance of `token` as a decimal string, or null while
 * loading / when no wallet is connected / on fetch failure.
 */
export function useTokenBalance(token: NotaCurrency | string): string | null {
  const { blockchainState } = useBlockchainData();
  const { getTokenBalance } = useTokens();
  const [balance, setBalance] = useState<string | null>(null);
  const isWalletConnected = blockchainState.account !== "";

  useEffect(() => {
    if (!isWalletConnected) {
      setBalance(null);
      return;
    }

    let cancelled = false;
    getTokenBalance(token)
      .then(({ parsedBalance }) => {
        if (!cancelled) {
          setBalance(parsedBalance);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch token balance", error);
        if (!cancelled) {
          setBalance(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getTokenBalance, isWalletConnected, token]);

  return balance;
}
