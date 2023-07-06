import { useToast } from "@chakra-ui/react";
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

  const toast = useToast();

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

  const containsUnrecognizedToken = useMemo(() => {
    return tokens.includes("");
  }, [tokens]);

  useEffect(() => {
    const fetchAllowance = async () => {
      if (!blockchainState.disperse) {
        return;
      }
      const uniqueTokens = Object.keys(tokenValues);
      const requiredApprovals = [];
      for (const token of uniqueTokens) {
        const tokenAllowance = await getTokenContract(
          token
        )?.functions.allowance(
          blockchainState.account,
          blockchainState.disperse.address
        );
        if (!tokenAllowance) {
          console.error("token not found");
          return;
        }
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
    if (containsUnrecognizedToken) {
      return ["Token not recognized", true];
    }
    if (isConfirmed) {
      return ["Transaction successful", true];
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
    containsUnrecognizedToken,
    isConfirmed,
    isCorrectChain,
    requiredApprovals,
  ]);

  const handleConfirm = useCallback(async () => {
    if (requiredApprovals.length > 0) {
      const approvalToken = requiredApprovals[0];

      try {
        const approval = await getTokenContract(
          approvalToken
        )?.functions.approve(
          blockchainState.disperse.address,
          BigNumber.from(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
          )
        );
        await approval.wait();
        setRequiredApprovals(requiredApprovals.slice(1));
      } catch (error) {
        toast({
          title: "Error approving tokens. Please try again",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error(error);
      }
    } else {
      try {
        const tx = await blockchainState.disperse.disperse(
          tokens,
          recipients,
          values
        );
        const receipt = await tx.wait();
        setIsConfirmed(true);
        toast({
          title: "Transaction confirmed",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        return receipt.transactionHash;
      } catch (error) {
        toast({
          title: "Error sending tokens. Check your wallet balance",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error(error);
      }
    }
  }, [
    requiredApprovals,
    getTokenContract,
    blockchainState.disperse,
    tokens,
    recipients,
    values,
    toast,
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
