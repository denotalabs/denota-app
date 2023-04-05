import { useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useNotaForm } from "../context/NotaFormProvider";
import { useNotaContext } from "../context/NotasContext";
import { useAxelarBridge } from "./modules/useAxelarBridge";
import { useDirectPay } from "./modules/useDirectPay";
import { useEscrowNota } from "./modules/useEscrowNota";
import { useEmail } from "./useEmail";

interface Props {
  onSuccess?: () => void;
}

export const useConfirmNota = ({ onSuccess }: Props) => {
  const toast = useToast();

  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  const { sendEmail } = useEmail();
  const [needsApproval, setNeedsApproval] = useState(
    notaFormValues.mode === "pay"
  );

  const token = useMemo(() => {
    switch (notaFormValues.token) {
      case "DAI":
        return blockchainState.dai;
      case "WETH":
        return blockchainState.weth;
      default:
        return null;
    }
  }, [blockchainState.dai, blockchainState.weth, notaFormValues.token]);

  const amountWei = useMemo(() => {
    if (!notaFormValues.amount || isNaN(parseFloat(notaFormValues.amount))) {
      return BigNumber.from(0);
    }
    return ethers.utils.parseEther(notaFormValues.amount);
  }, [notaFormValues]);

  const transferWei =
    notaFormValues.mode === "invoice" ? BigNumber.from(0) : amountWei;

  const { refreshWithDelay } = useNotaContext();

  const tokenAddress = useMemo(() => {
    switch (notaFormValues.token) {
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
    notaFormValues.token,
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
    if (notaFormValues.mode === "pay") {
      fetchAllowance();
    }
  }, [
    amountWei,
    blockchainState.account,
    blockchainState.registrarAddress,
    notaFormValues.mode,
    token,
    token?.functions,
  ]);

  const { writeNota: writeDirectPay } = useDirectPay();

  const { writeNota: writeEscrow } = useEscrowNota();

  const { writeNota: writeCrosschain } = useAxelarBridge();

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
        switch (notaFormValues.module) {
          case "direct":
            if (
              blockchainState.chainId === "0xaef3" &&
              notaFormValues.mode === "pay" &&
              notaFormValues.axelarEnabled
            ) {
              txHash = await writeCrosschain({
                tokenAddress,
                amountWei,
                address: notaFormValues.address,
                ipfsHash: notaFormValues.ipfsHash ?? "",
                imageUrl: notaFormValues.imageUrl ?? "",
              });
            } else {
              txHash = await writeDirectPay({
                dueDate: notaFormValues.dueDate,
                tokenAddress,
                amountWei,
                address: notaFormValues.address,
                instantWei: transferWei,
                ipfsHash: notaFormValues.ipfsHash ?? "",
                isInvoice: notaFormValues.mode === "invoice",
                imageUrl: notaFormValues.imageUrl ?? "",
              });
            }

            break;

          case "escrow":
            txHash = await writeEscrow({
              tokenAddress,
              amountWei,
              address: notaFormValues.address,
              escrowedWei: transferWei,
              ipfsHash: notaFormValues.ipfsHash ?? "",
              isInvoice: notaFormValues.mode === "invoice",
              inspector: notaFormValues.auditor,
              imageUrl: notaFormValues.imageUrl ?? "",
            });
            break;

          default:
            break;
        }

        if (txHash && notaFormValues.email) {
          await sendEmail({
            email: notaFormValues.email,
            txHash,
            network: blockchainState.chainId,
            token: notaFormValues.token,
            amount: notaFormValues.amount,
            module: "direct",
            isInvoice: notaFormValues.mode === "invoice",
          });
        }

        const message =
          notaFormValues.mode === "invoice"
            ? "Invoice created"
            : "Nota created";
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
    notaFormValues.module,
    notaFormValues.email,
    notaFormValues.mode,
    notaFormValues.axelarEnabled,
    notaFormValues.address,
    notaFormValues.ipfsHash,
    notaFormValues.auditor,
    notaFormValues.imageUrl,
    notaFormValues.dueDate,
    notaFormValues.token,
    notaFormValues.amount,
    toast,
    refreshWithDelay,
    onSuccess,
    writeEscrow,
    tokenAddress,
    transferWei,
    writeCrosschain,
    writeDirectPay,
    sendEmail,
  ]);

  return { needsApproval, approveAmount, writeNota };
};
