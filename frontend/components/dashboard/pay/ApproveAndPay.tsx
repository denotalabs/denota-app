import { Box, Text, useToast } from "@chakra-ui/react";
import { fund } from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaContext } from "../../../context/NotasContext";
import { Nota } from "../../../hooks/useNotas";
import RoundedBox from "../../designSystem/RoundedBox";
import RoundedButton from "../../designSystem/RoundedButton";

interface Props {
  nota: Nota;
  onClose: () => void;
}

function ApproveAndPay({ nota, onClose }: Props) {
  // TODO: support optimistic updates in useNotas
  const { refreshWithDelay } = useNotaContext();

  const toast = useToast();

  const { blockchainState } = useBlockchainData();

  const [needsApproval, setNeedsApproval] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const token = useMemo(() => {
    switch (nota.token) {
      case "DAI":
        return blockchainState.dai;
      case "WETH":
        return blockchainState.weth;
      default:
        return null;
    }
  }, [blockchainState.dai, blockchainState.weth, nota.token]);

  const tokenBalance = useMemo(() => {
    switch (nota.token) {
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
    nota.token,
  ]);

  const insufficientBalance = useMemo(() => {
    return nota.amountRaw.sub(tokenBalance) > BigNumber.from(0);
  }, [nota.amountRaw, tokenBalance]);

  useEffect(() => {
    const fetchAllowance = async () => {
      if (token === null) {
        setNeedsApproval(false);
      } else {
        const tokenAllowance = await token?.functions.allowance(
          blockchainState.account,
          blockchainState.registrarAddress
        );
        if (nota.amountRaw.sub(tokenAllowance[0]) > BigNumber.from(0)) {
          setNeedsApproval(true);
        } else {
          setNeedsApproval(false);
        }
      }
    };
    fetchAllowance();
  }, [
    blockchainState.account,
    blockchainState.registrarAddress,
    nota.amountRaw,
    token,
    token?.functions,
  ]);

  const buttonText = useMemo(() => {
    if (insufficientBalance) {
      return "Insufficient funds";
    }
    if (needsApproval) {
      return "Approve " + nota.token;
    }
    return "Pay";
  }, [nota.token, insufficientBalance, needsApproval]);

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
          blockchainState.registrarAddress,
          nota.amountRaw
        );
        await tx.wait();
        setNeedsApproval(false);
      } else {
        await fund({ notaId: nota.id });
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
      console.error(error);
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
    blockchainState.registrarAddress,
    nota.amountRaw,
    nota.id,
    needsApproval,
    onClose,
    refreshWithDelay,
    toast,
    token?.functions,
  ]);

  const moduleInfo = useMemo(() => {
    switch (nota.moduleData.module) {
      case "direct":
        return "Funds will be released immediately";
      case "escrow":
        return "Funds will be held in escrow";
    }
  }, [nota.moduleData.module]);

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
