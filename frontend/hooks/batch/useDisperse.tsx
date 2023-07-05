import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import {
  chainInfoForChainId,
  chainNumberToChainHex,
} from "../../context/chainInfo";
import { useTokens } from "../useTokens";
import { CsvData } from "./useBatchPaymentReader";

interface Props {
  chainId: number;
  data: CsvData[];
}

const useDisperse = ({ data, chainId }: Props) => {
  const { blockchainState } = useBlockchainData();

  const { getTokenAddress, getTokenContract } = useTokens();

  const [requiredApprovals, setRequiredApprovals] = useState([]);

  const isCorrectChain = useMemo(() => {
    return blockchainState.chainId === chainNumberToChainHex(chainId);
  }, [blockchainState.chainId, chainId]);

  const chainName = useMemo(() => {
    return chainInfoForChainId(chainId).displayName;
  }, [chainId]);

  const [isConfirmed, setIsConfirmed] = useState(false);

  const tokenValues = useMemo(() => {
    return data.reduce((acc, item) => {
      acc[item.token] = (acc[item.token] || 0) + item.value;
      return acc;
    }, {} as { [key: string]: number });
  }, [data]);

  const [tokens, values, recipients] = useMemo(
    () => [
      data.map((val) => getTokenAddress(val.token)),
      data.map((val) => ethers.utils.parseEther(String(val.value))),
      data.map((val) => val.recipient),
    ],
    [data, getTokenAddress]
  );

  useEffect(() => {
    const fetchAllowance = async () => {
      const uniqueTokens = Object.keys(tokenValues);
      const requiredApprovals = [];
      for (const token of uniqueTokens) {
        const tokenAllowance = await getTokenContract(
          token
        )?.functions.allowance(
          blockchainState.account,
          blockchainState.disperse.address
        );
        if (
          tokenAllowance[0].lt(
            ethers.utils.parseEther(String(tokenValues[token]))
          )
        ) {
          requiredApprovals.push(token);
        }
      }
      setRequiredApprovals(requiredApprovals);
    };

    if (isCorrectChain) {
      fetchAllowance();
    }
  }, [
    blockchainState.account,
    blockchainState.disperse,
    blockchainState.registrarAddress,
    getTokenContract,
    isCorrectChain,
    tokenValues,
  ]);

  const [buttonTitle, buttonDisabled] = useMemo(() => {
    if (isConfirmed) {
      return ["Confirmed", true];
    }
    if (!isCorrectChain) {
      return [`Switch to ${chainName}`, false];
    }
    if (!blockchainState.disperse) {
      return [`Chain unsupported. Coming soon.`, true];
    }
    if (requiredApprovals.length !== 0) {
      return [`Approve ${requiredApprovals[0]}`, false];
    }
    return ["Confirm", false];
  }, [
    blockchainState.disperse,
    chainName,
    isConfirmed,
    isCorrectChain,
    requiredApprovals,
  ]);

  const handleConfirm = useCallback(async () => {
    if (requiredApprovals.length > 0) {
      const approvalToken = requiredApprovals[0];
      setRequiredApprovals(requiredApprovals.slice(1));
      const approval = await getTokenContract(approvalToken)?.functions.approve(
        blockchainState.disperse.address,
        BigNumber.from(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        )
      );
      await approval.wait();
    } else {
      const tx = await blockchainState.disperse.disperse(
        tokens,
        recipients,
        values
      );
      const receipt = await tx.wait();
      setIsConfirmed(true);
      return receipt.transactionHash;
    }
  }, [
    requiredApprovals,
    getTokenContract,
    blockchainState.disperse,
    tokens,
    recipients,
    values,
  ]);

  return {
    handleConfirm,
    buttonTitle,
    isCorrectChain,
    isConfirmed,
    buttonDisabled,
  };
};

export default useDisperse;
