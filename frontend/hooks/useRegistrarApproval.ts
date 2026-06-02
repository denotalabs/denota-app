import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useTokens } from "./useTokens";

export function useRegistrarApproval(
  enabled: boolean,
  token: NotaCurrency | string,
  amount: string | undefined
) {
  const { blockchainState } = useBlockchainData();
  const { getTokenContract, getTokenUnits } = useTokens();
  const [needsApproval, setNeedsApproval] = useState(false);

  const tokenContract = useMemo(() => {
    if (!enabled || token === "UNKNOWN") {
      return null;
    }
    return getTokenContract(token as NotaCurrency);
  }, [enabled, getTokenContract, token]);

  const amountWei = useMemo(() => {
    if (!enabled || !amount || isNaN(parseFloat(amount))) {
      return BigNumber.from(0);
    }
    return ethers.utils.parseUnits(amount, getTokenUnits(token as NotaCurrency));
  }, [amount, enabled, getTokenUnits, token]);

  useEffect(() => {
    const fetchAllowance = async () => {
      if (!enabled || !tokenContract || !blockchainState.registrarAddress) {
        setNeedsApproval(false);
        return;
      }
      try {
        const tokenAllowance = await tokenContract.functions.allowance(
          blockchainState.account,
          blockchainState.registrarAddress
        );
        setNeedsApproval(
          amountWei.sub(tokenAllowance[0]).gt(BigNumber.from(0))
        );
      } catch (e) {
        console.log(e);
        setNeedsApproval(false);
      }
    };
    fetchAllowance();
  }, [
    amountWei,
    blockchainState.account,
    blockchainState.registrarAddress,
    enabled,
    tokenContract,
  ]);

  const approveAmount = useCallback(async () => {
    if (!tokenContract || !blockchainState.registrarAddress) {
      return;
    }
    const tx = await tokenContract.functions.approve(
      blockchainState.registrarAddress,
      amountWei
    );
    await tx.wait();
    setNeedsApproval(false);
  }, [
    amountWei,
    blockchainState.registrarAddress,
    tokenContract,
  ]);

  return { needsApproval, approveAmount };
}
