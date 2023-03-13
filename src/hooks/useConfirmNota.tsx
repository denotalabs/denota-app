import { useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useCheqContext } from "../context/CheqsContext";
import { useNotaForm } from "../context/NotaFormProvider";
import { useDirectPay } from "./modules/useDirectPay";
import { useEscrow } from "./modules/useEscrow";
import { useEmail } from "./useEmail";

interface Props {
  onSuccess?: () => void;
}

export const useConfirmNota = ({ onSuccess }: Props) => {
  const toast = useToast();

  const { formData } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  const { sendEmail } = useEmail();
  const [needsApproval, setNeedsApproval] = useState(formData.mode === "pay");

  const token =
    formData.token == "DAI" ? blockchainState.dai : blockchainState.weth;

  const amountWei = useMemo(() => {
    if (!formData.amount) {
      return BigNumber.from(0);
    }
    return ethers.utils.parseEther(formData.amount);
  }, [formData]);

  const escrowedWei =
    formData.mode === "invoice" ? BigNumber.from(0) : amountWei;

  const { refreshWithDelay } = useCheqContext();

  const tokenAddress = useMemo(() => {
    switch (formData.token) {
      case "DAI":
        return blockchainState.dai?.address ?? "";
      case "WETH":
        return blockchainState.weth?.address ?? "";
      default:
        return "";
    }
  }, [
    blockchainState.dai?.address,
    blockchainState.weth?.address,
    formData.token,
  ]);

  useEffect(() => {
    const fetchAllowance = async () => {
      const tokenAllowance = await token?.functions.allowance(
        blockchainState.account,
        blockchainState.cheqAddress
      );
      if (amountWei.sub(tokenAllowance[0]) > BigNumber.from(0)) {
        setNeedsApproval(true);
      } else {
        setNeedsApproval(false);
      }
    };
    if (formData.mode === "pay") {
      fetchAllowance();
    }
  }, [
    amountWei,
    blockchainState.account,
    blockchainState.cheqAddress,
    formData.mode,
    token?.functions,
  ]);

  const { writeCheq: writeDirectPayCheq } = useDirectPay();

  const { writeCheq: writeEscrowCheq } = useEscrow();

  const approveAmount = useCallback(async () => {
    // Disabling infinite approvals until audit it complete
    // To enable:
    // BigNumber.from(
    //   "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    // );
    const tx = await token?.functions.approve(
      blockchainState.cheqAddress,
      amountWei
    );
    await tx.wait();
    setNeedsApproval(false);
  }, [amountWei, blockchainState.cheqAddress, token?.functions]);

  const writeNota = useCallback(async () => {
    if (needsApproval) {
      // Disabling infinite approvals until audit it complete
      // To enable:
      // BigNumber.from(
      //   "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      // );
      const tx = await token?.functions.approve(
        blockchainState.cheqAddress,
        amountWei
      );
      await tx.wait();
      setNeedsApproval(false);
    } else {
      try {
        let txHash = "";
        switch (formData.module) {
          case "direct":
            txHash = await writeDirectPayCheq({
              dueDate: formData.dueDate,
              tokenAddress,
              amountWei,
              address: formData.address,
              escrowedWei,
              noteKey: formData.noteKey,
              isInvoice: formData.mode === "invoice",
            });
            break;
          case "escrow":
            txHash = await writeEscrowCheq({
              tokenAddress,
              amountWei,
              address: formData.address,
              escrowedWei,
              noteKey: formData.noteKey,
              isInvoice: formData.mode === "invoice",
            });
            break;

          default:
            break;
        }

        if (txHash && formData.email) {
          await sendEmail({
            email: formData.email,
            txHash,
            network: blockchainState.chainId,
            token: formData.token,
            amount: formData.amount,
            module: "direct",
            isInvoice: formData.mode === "invoice",
          });
        }

        const message =
          formData.mode === "invoice" ? "Invoice created" : "Cheq created";
        toast({
          title: "Transaction succeeded",
          description: message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        refreshWithDelay();
        onSuccess?.();
      } catch (error) {
        console.log(error);
        toast({
          title: "Transaction failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [
    amountWei,
    blockchainState.chainId,
    blockchainState.cheqAddress,
    escrowedWei,
    formData.address,
    formData.amount,
    formData.dueDate,
    formData.email,
    formData.mode,
    formData.module,
    formData.noteKey,
    formData.token,
    needsApproval,
    onSuccess,
    refreshWithDelay,
    sendEmail,
    toast,
    token?.functions,
    tokenAddress,
    writeDirectPayCheq,
    writeEscrowCheq,
  ]);

  return { needsApproval, approveAmount, writeNota };
};
