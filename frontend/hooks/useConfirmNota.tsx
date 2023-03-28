import { useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useNotaForm } from "../context/NotaFormProvider";
import { useNotaContext } from "../context/NotasContext";
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

  const token = useMemo(() => {
    switch (formData.token) {
      case "DAI":
        return blockchainState.dai;
      case "WETH":
        return blockchainState.weth;
      default:
        return null;
    }
  }, [blockchainState.dai, blockchainState.weth, formData.token]);

  const amountWei = useMemo(() => {
    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      return BigNumber.from(0);
    }
    return ethers.utils.parseEther(formData.amount);
  }, [formData]);

  const transferWei =
    formData.mode === "invoice" ? BigNumber.from(0) : amountWei;

  const { refreshWithDelay } = useNotaContext();

  const tokenAddress = useMemo(() => {
    switch (formData.token) {
      case "DAI":
        return blockchainState.dai?.address ?? "";
      case "WETH":
        return blockchainState.weth?.address ?? "";
      case "NATIVE":
        return "0x0000000000000000000000000000000000000000";
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
      if (token === null) {
        setNeedsApproval(false);
      } else {
        const tokenAllowance = await token?.functions.allowance(
          blockchainState.account,
          blockchainState.registrarAddress
        );
        if (amountWei.sub(tokenAllowance[0]) > BigNumber.from(0)) {
          setNeedsApproval(true);
        } else {
          setNeedsApproval(false);
        }
      }
    };
    if (formData.mode === "pay") {
      fetchAllowance();
    }
  }, [
    amountWei,
    blockchainState.account,
    blockchainState.registrarAddress,
    formData.mode,
    token,
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
      blockchainState.registrarAddress,
      amountWei
    );
    await tx.wait();
    setNeedsApproval(false);
  }, [amountWei, blockchainState.registrarAddress, token?.functions]);

  const writeNota = useCallback(async () => {
    if (needsApproval) {
      // Disabling infinite approvals until audit it complete
      // To enable:
      // BigNumber.from(
      //   "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      // );
      const tx = await token?.functions.approve(
        blockchainState.registrarAddress,
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
              instantWei: transferWei,
              ipfsHash: formData.ipfsHash,
              isInvoice: formData.mode === "invoice",
              imageUrl: formData.imageUrl,
            });
            break;
          case "escrow":
            txHash = await writeEscrowCheq({
              tokenAddress,
              amountWei,
              address: formData.address,
              escrowedWei: transferWei,
              ipfsHash: formData.ipfsHash,
              isInvoice: formData.mode === "invoice",
              inspector: formData.auditor,
              imageUrl: formData.imageUrl,
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
    needsApproval,
    token?.functions,
    blockchainState.registrarAddress,
    blockchainState.chainId,
    amountWei,
    formData.module,
    formData.email,
    formData.mode,
    formData.dueDate,
    formData.address,
    formData.ipfsHash,
    formData.imageUrl,
    formData.auditor,
    formData.token,
    formData.amount,
    toast,
    refreshWithDelay,
    onSuccess,
    writeDirectPayCheq,
    tokenAddress,
    transferWei,
    writeEscrowCheq,
    sendEmail,
  ]);

  return { needsApproval, approveAmount, writeNota };
};
