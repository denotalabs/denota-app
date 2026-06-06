import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useTokens } from "./useTokens";

interface FundReadinessState {
  insufficientBalance: boolean;
  needsApproval: boolean;
  isChecking: boolean;
}

const idleState: FundReadinessState = {
  insufficientBalance: false,
  needsApproval: false,
  isChecking: false,
};

export function useFundReadiness({
  tokenAddress,
  escrow,
  instant,
  enabled,
}: {
  tokenAddress: string;
  escrow: string;
  instant: string;
  enabled: boolean;
}) {
  const { blockchainState } = useBlockchainData();
  const { currencyForTokenId, getTokenUnits, getTokenContract, getTokenBalance } =
    useTokens();

  const [state, setState] = useState<FundReadinessState>(idleState);

  const token = currencyForTokenId(tokenAddress);
  const totalAmount = useMemo(() => {
    const escrowNum = parseFloat(escrow || "0") || 0;
    const instantNum = parseFloat(instant || "0") || 0;
    return escrowNum + instantNum;
  }, [escrow, instant]);

  const amountWei = useMemo(() => {
    if (totalAmount <= 0 || token === "UNKNOWN") {
      return BigNumber.from(0);
    }
    return ethers.utils.parseUnits(String(totalAmount), getTokenUnits(token));
  }, [getTokenUnits, token, totalAmount]);

  const tokenContract = useMemo(() => {
    if (!enabled || token === "UNKNOWN") {
      return null;
    }
    return getTokenContract(token);
  }, [enabled, getTokenContract, token]);

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
    if (!enabled || amountWei.isZero() || !tokenContract) {
      setState(idleState);
      return;
    }

    setState((current) => ({ ...current, isChecking: true }));

    let cancelled = false;

    const check = async () => {
      try {
        const [{ rawBalance }, allowanceResult] = await Promise.all([
          getTokenBalance(token),
          tokenContract.functions.allowance(
            blockchainState.account,
            blockchainState.registrarAddress
          ),
        ]);

        if (cancelled) {
          return;
        }

        const allowance = allowanceResult[0] as BigNumber;
        setState({
          insufficientBalance: amountWei.gt(BigNumber.from(rawBalance)),
          needsApproval: amountWei.sub(allowance).gt(BigNumber.from(0)),
          isChecking: false,
        });
      } catch {
        if (!cancelled) {
          setState(idleState);
        }
      }
    };

    const timeoutId = window.setTimeout(check, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    amountWei,
    blockchainState.account,
    blockchainState.registrarAddress,
    enabled,
    getTokenBalance,
    token,
    tokenContract,
  ]);

  return { ...state, approveAmount, totalAmount };
}
