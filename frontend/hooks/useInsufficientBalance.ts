import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import {
  BalanceCheckCache,
  useNotaForm,
} from "../context/NotaFormProvider";
import { useTokens } from "./useTokens";

const BALANCE_CHECK_DEBOUNCE_MS = 1000;

export function hasValidPaymentAmount(amount: string | undefined): boolean {
  if (amount === undefined || amount === "") {
    return false;
  }
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && parsed > 0;
}

export interface BalanceCheckState {
  insufficientBalance: boolean;
  isCheckingBalance: boolean;
  balanceChecked: boolean;
}

function matchesBalanceCheckCache(
  cache: BalanceCheckCache | null,
  account: string,
  token: string,
  amount: string | undefined
): cache is BalanceCheckCache {
  return (
    cache !== null &&
    cache.account === account &&
    cache.token === token &&
    cache.amount === amount &&
    hasValidPaymentAmount(amount)
  );
}

export function useInsufficientBalance(
  token: NotaCurrency | string,
  amount: string | undefined,
  enabled: boolean
): BalanceCheckState {
  const { blockchainState } = useBlockchainData();
  const { getTokenBalance, getTokenUnits } = useTokens();
  const { balanceCheckCache, setBalanceCheckCache } = useNotaForm();
  const account = blockchainState.account;
  const cached = matchesBalanceCheckCache(
    balanceCheckCache,
    account,
    token,
    amount
  )
    ? balanceCheckCache
    : null;

  const [state, setState] = useState<BalanceCheckState>({
    insufficientBalance: false,
    isCheckingBalance: false,
    balanceChecked: false,
  });

  useEffect(() => {
    if (cached) {
      return;
    }

    if (!enabled) {
      setState({
        insufficientBalance: false,
        isCheckingBalance: false,
        balanceChecked: false,
      });
      return;
    }

    setState({
      insufficientBalance: false,
      isCheckingBalance: true,
      balanceChecked: false,
    });

    const timeoutId = window.setTimeout(async () => {
      if (
        !account ||
        token === "UNKNOWN" ||
        !hasValidPaymentAmount(amount)
      ) {
        setState({
          insufficientBalance: false,
          isCheckingBalance: false,
          balanceChecked: false,
        });
        return;
      }

      try {
        const { rawBalance } = await getTokenBalance(token as NotaCurrency);
        const amountWei = ethers.utils.parseUnits(
          amount!,
          getTokenUnits(token as NotaCurrency)
        );
        const insufficientBalance = amountWei.gt(BigNumber.from(rawBalance));
        setBalanceCheckCache({
          account,
          token,
          amount: amount!,
          insufficientBalance,
        });
        setState({
          insufficientBalance,
          isCheckingBalance: false,
          balanceChecked: true,
        });
      } catch (e) {
        console.log(e);
        setState({
          insufficientBalance: false,
          isCheckingBalance: false,
          balanceChecked: false,
        });
      }
    }, BALANCE_CHECK_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      setState((current) => ({
        ...current,
        isCheckingBalance: false,
      }));
    };
  }, [
    account,
    amount,
    cached,
    enabled,
    getTokenBalance,
    getTokenUnits,
    setBalanceCheckCache,
    token,
  ]);

  if (!enabled) {
    return {
      insufficientBalance: false,
      isCheckingBalance: false,
      balanceChecked: false,
    };
  }

  if (cached) {
    return {
      insufficientBalance: cached.insufficientBalance,
      isCheckingBalance: false,
      balanceChecked: true,
    };
  }

  return state;
}
