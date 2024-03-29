import { useToast } from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../../components/designSystem/CurrencyIcon";
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
  const { blockchainState, isInitializing } = useBlockchainData();

  const { getTokenAddress, getTokenContract, parseTokenValue } = useTokens();

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

  const [tokens, values, recipients] = useMemo(() => [[], [], []], []);

  const containsUnrecognizedToken = useMemo(() => {
    return tokens.includes("");
  }, [tokens]);

  useEffect(() => {
    const fetchAllowance = async () => {
      if (!blockchainState.disperse || isInitializing) {
        return;
      }
      const uniqueTokens = Object.keys(tokenValues);
      const requiredApprovals = [];
      for (const token of uniqueTokens) {
        try {
          const tokenAllowance = await getTokenContract(
            token as NotaCurrency
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
              parseTokenValue(token as NotaCurrency, tokenValues[token])
            )
          ) {
            requiredApprovals.push(token);
          }
        } catch (error) {
          requiredApprovals.push(token);
          console.error(error);
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
    chainId,
    getTokenContract,
    isCorrectChain,
    isInitializing,
    parseTokenValue,
    tokenValues,
  ]);

  const [buttonTitle, buttonDisabled] = useMemo(() => {
    if (isConfirmed) {
      return ["Transaction successful", true];
    }
    if (!isCorrectChain) {
      return [`Switch to ${chainName}`, false];
    }
    if (containsUnrecognizedToken) {
      return ["Token not recognized", true];
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
    chainId,
    blockchainState.disperse,
    toast,
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
