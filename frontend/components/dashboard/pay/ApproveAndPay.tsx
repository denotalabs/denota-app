import { Box, Text, useToast } from "@chakra-ui/react";
import { fund } from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../../../context/BlockchainDataProvider";
import { useNotaContext } from "../../../context/NotasContext";
import { Nota } from "../../../hooks/useNotas";
import { useTokens } from "../../../hooks/useTokens";
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

  const [insufBalance, setInsufBalance] = useState(true);

  const [isLoading, setIsLoading] = useState(false);

  const { getTokenAllowance, getTokenBalance, getTokenContract } = useTokens();

  useEffect(() => {
    const fetchAllowance = async () => {
      const token = getTokenContract(nota.token);
      if (token === null) {
        setNeedsApproval(false);
      } else {
        const tokenAllowance = await getTokenAllowance(nota.token);
        if (nota.amountRaw.sub(tokenAllowance[0]) > BigNumber.from(0)) {
          setNeedsApproval(true);
        } else {
          setNeedsApproval(false);
        }
      }
    };
    const fetchBalance = async () => {
      const { rawBalance } = await getTokenBalance(nota.token);
      if (nota.amountRaw.sub(rawBalance) > BigNumber.from(0)) {
        setInsufBalance(true);
      } else {
        setInsufBalance(false);
      }
    };

    fetchAllowance();
    fetchBalance();
  }, [
    blockchainState.account,
    blockchainState.registrarAddress,
    getTokenAllowance,
    getTokenBalance,
    getTokenContract,
    nota.amountRaw,
    nota.token,
  ]);

  const buttonText = useMemo(() => {
    if (insufBalance) {
      return "Insufficient funds";
    }
    if (needsApproval) {
      return "Approve " + nota.token;
    }
    return "Pay";
  }, [insufBalance, needsApproval, nota.token]);

  const handlePay = useCallback(async () => {
    setIsLoading(true);
    try {
      if (needsApproval) {
        // Disabling infinite approvals until audit it complete
        // To enable:
        // BigNumber.from(
        //   "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        // );
        const tx = await getTokenContract(nota.token)?.functions.approve(
          blockchainState.registrarAddress,
          nota.amountRaw
        );
        await tx.wait();
        setNeedsApproval(false);
      } else {
        const module = nota.moduleData.module;
        if (module === "directSend" || module === "cashBeforeDateDrip" || module === "unknown") {
          return;
        }
        await fund({ notaId: nota.id, amount: nota.amountRaw, module });
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
    needsApproval,
    getTokenContract,
    nota.token,
    nota.amountRaw,
    nota.id,
    blockchainState.registrarAddress,
    toast,
    refreshWithDelay,
    onClose,
  ]);

  // TODO add more module info for last send page
  const moduleInfo = useMemo(() => {
    switch (nota.moduleData.module) {
      case "directSend":
        return "Funds will be released immediately";
      case "reversibleRelease":
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
        isDisabled={insufBalance}
        isLoading={isLoading}
        onClick={handlePay}
      >
        {buttonText}
      </RoundedButton>
    </Box>
  );
}

export default ApproveAndPay;
