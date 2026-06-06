import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useNotaForm } from "../context/NotaFormProvider";
import {
  BALANCE_CHECK_DEBOUNCE_MS,
  hasValidPaymentAmount,
} from "../utils/paymentValidation";
import { useTokens } from "./useTokens";

interface PaymentReadinessState {
  insufficientBalance: boolean;
  needsApproval: boolean;
  isChecking: boolean;
}

const idleState: PaymentReadinessState = {
  insufficientBalance: false,
  needsApproval: false,
  isChecking: false,
};

export function usePaymentReadiness({
  token,
  amount,
  balanceCheckEnabled,
  approvalCheckEnabled,
}: {
  token: NotaCurrency | string;
  amount: string | undefined;
  balanceCheckEnabled: boolean;
  approvalCheckEnabled: boolean;
}) {
  const { blockchainState } = useBlockchainData();
  const { getTokenBalance, getTokenUnits, getTokenContract } = useTokens();
  const { balanceCheckCache, setBalanceCheckCache } = useNotaForm();
  const account = blockchainState.account;

  const [state, setState] = useState<PaymentReadinessState>(idleState);

  const cachedBalance = useMemo(() => {
    if (
      !balanceCheckEnabled ||
      balanceCheckCache === null ||
      balanceCheckCache.account !== account ||
      balanceCheckCache.token !== token ||
      balanceCheckCache.amount !== amount ||
      !hasValidPaymentAmount(amount)
    ) {
      return null;
    }
    return balanceCheckCache;
  }, [account, amount, balanceCheckCache, balanceCheckEnabled, token]);

  const tokenContract = useMemo(() => {
    if (!approvalCheckEnabled || token === "UNKNOWN") {
      return null;
    }
    return getTokenContract(token as NotaCurrency);
  }, [approvalCheckEnabled, getTokenContract, token]);

  const amountWei = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount)) || token === "UNKNOWN") {
      return BigNumber.from(0);
    }
    return ethers.utils.parseUnits(amount, getTokenUnits(token as NotaCurrency));
  }, [amount, getTokenUnits, token]);

  const approveAmount = useCallback(async () => {
    if (!tokenContract || !blockchainState.registrarAddress) {
      return;
    }
    const tx = await tokenContract.functions.approve(
      blockchainState.registrarAddress,
      amountWei
    );
    await tx.wait();
    setState((current) => ({ ...current, needsApproval: false }));
  }, [amountWei, blockchainState.registrarAddress, tokenContract]);

  useEffect(() => {
    if (!balanceCheckEnabled && !approvalCheckEnabled) {
      setState(idleState);
      return;
    }

    if (cachedBalance?.insufficientBalance) {
      setState({
        insufficientBalance: true,
        needsApproval: false,
        isChecking: false,
      });
      return;
    }

    setState((current) => ({
      ...current,
      isChecking: true,
    }));

    const debounceMs = cachedBalance ? 0 : BALANCE_CHECK_DEBOUNCE_MS;

    const timeoutId = window.setTimeout(async () => {
      const runBalance = balanceCheckEnabled && !cachedBalance;
      const runApproval =
        approvalCheckEnabled &&
        tokenContract &&
        blockchainState.registrarAddress;

      if (!runBalance && !runApproval) {
        setState({
          insufficientBalance: cachedBalance?.insufficientBalance ?? false,
          needsApproval: false,
          isChecking: false,
        });
        return;
      }

      try {
        const [balanceResult, needsApproval] = await Promise.all([
          runBalance
            ? (async () => {
                if (
                  !account ||
                  token === "UNKNOWN" ||
                  !hasValidPaymentAmount(amount)
                ) {
                  return false;
                }
                const { rawBalance } = await getTokenBalance(
                  token as NotaCurrency
                );
                const insufficientBalance = amountWei.gt(
                  BigNumber.from(rawBalance)
                );
                setBalanceCheckCache({
                  account,
                  token,
                  amount: amount!,
                  insufficientBalance,
                });
                return insufficientBalance;
              })()
            : Promise.resolve(cachedBalance!.insufficientBalance),
          runApproval
            ? (async () => {
                const tokenAllowance = await tokenContract!.functions.allowance(
                  account,
                  blockchainState.registrarAddress
                );
                return amountWei
                  .sub(tokenAllowance[0])
                  .gt(BigNumber.from(0));
              })()
            : Promise.resolve(false),
        ]);

        setState({
          insufficientBalance: balanceResult,
          needsApproval,
          isChecking: false,
        });
      } catch (e) {
        console.error(e);
        setState({
          insufficientBalance: cachedBalance?.insufficientBalance ?? false,
          needsApproval: false,
          isChecking: false,
        });
      }
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    account,
    amount,
    amountWei,
    approvalCheckEnabled,
    balanceCheckEnabled,
    blockchainState.registrarAddress,
    cachedBalance,
    getTokenBalance,
    setBalanceCheckCache,
    token,
    tokenContract,
  ]);

  if (!balanceCheckEnabled && !approvalCheckEnabled) {
    return { ...idleState, approveAmount };
  }

  if (cachedBalance?.insufficientBalance) {
    return {
      insufficientBalance: true,
      needsApproval: false,
      isChecking: false,
      approveAmount,
    };
  }

  if (cachedBalance && !approvalCheckEnabled) {
    return {
      insufficientBalance: cachedBalance.insufficientBalance,
      needsApproval: false,
      isChecking: false,
      approveAmount,
    };
  }

  return { ...state, approveAmount };
}
