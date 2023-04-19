import { useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
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

  const { addOptimisticNota } = useNotaContext();

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

        // Use lighthouse url while we investigate lighthouse IPFS issue
        const lighthouseUrl = !notaFormValues.imageUrl
          ? ""
          : `https://gateway.lighthouse.storage/ipfs/${
              notaFormValues.imageUrl.split("ipfs://")[1]
            }`;

        const isCrossChain =
          notaFormValues.module === "direct" &&
          blockchainState.chainId === "0xaef3" &&
          notaFormValues.mode === "pay" &&
          !!notaFormValues.axelarEnabled;

        switch (notaFormValues.module) {
          case "direct":
            if (isCrossChain) {
              txHash = await writeCrosschain({
                tokenAddress,
                amount: notaFormValues.amount,
                address: notaFormValues.address,
                ipfsHash: notaFormValues.ipfsHash ?? "",
                imageUrl: lighthouseUrl,
                token: notaFormValues.token,
              });
            } else {
              txHash = await writeDirectPay({
                dueDate: notaFormValues.dueDate,
                amount: notaFormValues.amount,
                address: notaFormValues.address,
                ipfsHash: notaFormValues.ipfsHash ?? "",
                isInvoice: notaFormValues.mode === "invoice",
                imageUrl: lighthouseUrl,
                token: notaFormValues.token,
              });
            }

            break;

          case "escrow":
            txHash = await writeEscrow({
              token: notaFormValues.token,
              amount: notaFormValues.amount,
              address: notaFormValues.address,
              ipfsHash: notaFormValues.ipfsHash ?? "",
              isInvoice: notaFormValues.mode === "invoice",
              inspector: notaFormValues.auditor,
              imageUrl: notaFormValues.imageUrl ?? "",
            });
            break;

          default:
            break;
        }

        const isInvoice = notaFormValues.mode === "invoice";

        const owner = isInvoice
          ? blockchainState.account
          : notaFormValues.address;

        addOptimisticNota({
          id: "TODO",
          amount: Number(notaFormValues.amount),
          sender: blockchainState.account,
          receiver: notaFormValues.address,
          isInvoice,
          owner,
          token: notaFormValues.token as NotaCurrency,
          isCrossChain,
          createdHash: txHash,
          module: notaFormValues.module as "direct" | "escrow",
          uri: notaFormValues.ipfsHash,
        });

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
    blockchainState.account,
    amountWei,
    notaFormValues.imageUrl,
    notaFormValues.module,
    notaFormValues.mode,
    notaFormValues.axelarEnabled,
    notaFormValues.address,
    notaFormValues.amount,
    notaFormValues.token,
    notaFormValues.ipfsHash,
    notaFormValues.email,
    notaFormValues.auditor,
    notaFormValues.dueDate,
    addOptimisticNota,
    toast,
    onSuccess,
    writeEscrow,
    writeCrosschain,
    tokenAddress,
    writeDirectPay,
    sendEmail,
  ]);

  return { needsApproval, approveAmount, writeNota };
};
