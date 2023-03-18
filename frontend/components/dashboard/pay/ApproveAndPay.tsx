import { Box, Text, useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useCheqContext } from "../../../context/CheqsContext";
import { Cheq } from "../../../hooks/useCheqs";
import RoundedBox from "../../designSystem/RoundedBox";
import RoundedButton from "../../designSystem/RoundedButton";

interface Props {
  cheq: Cheq;
  onClose: () => void;
}

function ApproveAndPay({ cheq, onClose }: Props) {
  // TODO: support optimistic updates in useCheqs
  const { refreshWithDelay } = useCheqContext();

  const toast = useToast();

  const { blockchainState } = useBlockchainData();

  const [needsApproval, setNeedsApproval] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const token = useMemo(() => {
    switch (cheq.token) {
      case "DAI":
        return blockchainState.dai;
      case "WETH":
        return blockchainState.weth;
      default:
        return null;
    }
  }, [blockchainState.dai, blockchainState.weth, cheq.token]);

  const tokenAddress = useMemo(() => {
    switch (cheq.token) {
      case "DAI":
        return blockchainState.dai?.address ?? "";
      case "WETH":
        return blockchainState.weth?.address ?? "";
      case "NATIVE":
        return "0x0000000000000000000000000000000000000000";
      default:
        return "";
    }
  }, [blockchainState.dai?.address, blockchainState.weth?.address, cheq.token]);

  const tokenBalance = useMemo(() => {
    switch (cheq.token) {
      case "DAI":
        return blockchainState.userDaiBalanceRaw;
      case "WETH":
        return blockchainState.userWethBalanceRaw;
      case "NATIVE":
        return blockchainState.walletBalanceRaw;
      default:
        return BigNumber.from(0);
    }
  }, [
    blockchainState.userDaiBalanceRaw,
    blockchainState.userWethBalanceRaw,
    blockchainState.walletBalanceRaw,
    cheq.token,
  ]);

  const insufficientBalance = useMemo(() => {
    return cheq.amountRaw.sub(tokenBalance) > BigNumber.from(0);
  }, [cheq.amountRaw, tokenBalance]);

  useEffect(() => {
    const fetchAllowance = async () => {
      if (token === null) {
        setNeedsApproval(false);
      } else {
        const tokenAllowance = await token?.functions.allowance(
          blockchainState.account,
          blockchainState.cheqAddress
        );
        if (cheq.amountRaw.sub(tokenAllowance[0]) > BigNumber.from(0)) {
          setNeedsApproval(true);
        } else {
          setNeedsApproval(false);
        }
      }
    };
    fetchAllowance();
  }, [
    blockchainState.account,
    blockchainState.cheqAddress,
    cheq.amountRaw,
    token,
    token?.functions,
  ]);

  const buttonText = useMemo(() => {
    if (insufficientBalance) {
      return "Insufficient funds";
    }
    if (needsApproval) {
      return "Approve " + cheq.token;
    }
    return "Pay";
  }, [cheq.token, insufficientBalance, needsApproval]);

  const handlePay = useCallback(async () => {
    setIsLoading(true);
    try {
      if (needsApproval) {
        // Disabling infinite approvals until audit it complete
        // To enable:
        // BigNumber.from(
        //   "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        // );
        const tx = await token?.functions.approve(
          blockchainState.cheqAddress,
          cheq.amountRaw
        );
        await tx.wait();
        setNeedsApproval(false);
      } else {
        const cheqId = Number(cheq.id);
        const amount = BigNumber.from(cheq.amountRaw);
        const msgValue =
          tokenAddress === "0x0000000000000000000000000000000000000000"
            ? amount
            : BigNumber.from(0);
        const payload = ethers.utils.defaultAbiCoder.encode(
          ["address"],
          [blockchainState.account]
        );

        const instantAmount = cheq.moduleData.module === "direct" ? amount : 0;
        const escrowAmount = cheq.moduleData.module === "escrow" ? amount : 0;

        const tx = await blockchainState.cheq?.fund(
          cheqId,
          escrowAmount, // escrow
          instantAmount, // instant
          payload,
          { value: msgValue }
        );
        await tx.wait();
        toast({
          title: "Transaction succeeded",
          description: "Invoice paid",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        refreshWithDelay();
        onClose();
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Transaction failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    blockchainState.account,
    blockchainState.cheq,
    blockchainState.cheqAddress,
    cheq.amountRaw,
    cheq.id,
    needsApproval,
    onClose,
    refreshWithDelay,
    toast,
    token?.functions,
    tokenAddress,
  ]);

  const moduleInfo = useMemo(() => {
    switch (cheq.moduleData.module) {
      case "direct":
        return "Funds will be released immediately";
      case "escrow":
        return "Funds will be held in escrow";
    }
  }, [cheq.moduleData.module]);

  return (
    <Box w="100%" p={4}>
      <RoundedBox mt={8} p={6}>
        <Text fontWeight={600} fontSize={"xl"} textAlign="center">
          {moduleInfo}
        </Text>
      </RoundedBox>
      <RoundedButton
        isDisabled={insufficientBalance}
        isLoading={isLoading}
        onClick={handlePay}
      >
        {buttonText}
      </RoundedButton>
    </Box>
  );
}

export default ApproveAndPay;
