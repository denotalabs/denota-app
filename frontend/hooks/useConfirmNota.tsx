import { useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useNotaForm } from "../context/NotaFormProvider";
import { useNotaContext } from "../context/NotasContext";
// TODO need to switch to SDK for these
import { useDirectPay } from "./modules/useDirectPay";
import { useReversibleRelease } from "./modules/useReversibleRelease";
import { useSimpleCash } from "./modules/useSimpleCash";
import { useEmail } from "./useEmail";
import { useTokens } from "./useTokens";

interface Props {
  onSuccess?: () => void;
}

// Asks for token approval if not already, tries writing nota and creates local version, sends email if provided
export const useConfirmNota = ({ onSuccess }: Props) => {
  const toast = useToast();

  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  const { sendEmail } = useEmail();
  const [needsApproval, setNeedsApproval] = useState(
    notaFormValues.mode === "pay"
  );

  const { getTokenContract } = useTokens();

  const token = useMemo(() => {
    return getTokenContract(notaFormValues.token);
  }, [getTokenContract, notaFormValues.token]);

  const amountWei = useMemo(() => {
    if (!notaFormValues.amount || isNaN(parseFloat(notaFormValues.amount))) {
      return BigNumber.from(0);
    }
    return ethers.utils.parseUnits(notaFormValues.amount, 6);
  }, [notaFormValues]);

  const { createLocalNota } = useNotaContext();

  useEffect(() => {
    const fetchAllowance = async () => {
      if (token === null) {
        setNeedsApproval(false);
      } else {
        try {
          const tokenAllowance = await token?.functions.allowance(
            blockchainState.account,
            blockchainState.registrarAddress
          );
          if (amountWei.sub(tokenAllowance[0]) > BigNumber.from(0)) {
            setNeedsApproval(true);
          } else {
            setNeedsApproval(false);
          }
        } catch (e) {
          console.log(e);
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

  const { writeNota: writeReversibleRelease } = useReversibleRelease();

  const { writeNota: writeSimpleCash } = useSimpleCash();

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
        const owner = notaFormValues.address;
        let receipt: { txHash: string; notaId: string };

        switch (notaFormValues.module) {
          case "directSend":
            receipt = await writeDirectPay({
              token: notaFormValues.token,
              amount: notaFormValues.amount,
              address: owner,
              // dueDate: notaFormValues.dueDate,
              externalURI: notaFormValues.externalURI ?? "",
              imageURI: notaFormValues.imageURI,
            });
            break;
          case "simpleCash":
            receipt = await writeSimpleCash({
              token: notaFormValues.token,
              amount: notaFormValues.amount,
              address: owner,
              externalURI: notaFormValues.externalURI ?? "",
              imageURI: notaFormValues.imageURI ?? "",
            });
            break;
          case "reversibleRelease":
            receipt = await writeReversibleRelease({
              token: notaFormValues.token,
              amount: notaFormValues.amount,
              address: owner,
              inspector: notaFormValues.auditor,
              externalURI: notaFormValues.externalURI ?? "",
              imageURI: notaFormValues.imageURI ?? "",
            });
            break;
          default:
            break;
        }

        // It takes a few seconds for the graph to pick up the new nota so go ahead and add it locally
        createLocalNota({
          id: receipt.notaId,
          amount: Number(notaFormValues.amount),
          sender: blockchainState.account,
          receiver: notaFormValues.address,
          owner,
          token: notaFormValues.token as NotaCurrency,
          isCrossChain: false,
          createdHash: receipt.txHash,
          module: notaFormValues.module as "directSend" | "simpleCash" | "cashBeforeDate" | "reversibleRelease" | "reversibleByBeforeDate" | "cashBeforeDateDrip",
          uri: notaFormValues.ipfsHash,
        });

        if (receipt.txHash && notaFormValues.email) {
          await sendEmail({
            email: notaFormValues.email,
            txHash: receipt.txHash,
            network: blockchainState.chainId,
            token: notaFormValues.token,
            amount: notaFormValues.amount,
            module: "directSend",
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
        console.error(error);
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
    blockchainState.account,
    blockchainState.chainId,
    amountWei,
    notaFormValues.module,
    notaFormValues.address,
    notaFormValues.amount,
    notaFormValues.token,
    notaFormValues.ipfsHash,
    notaFormValues.email,
    notaFormValues.mode,
    notaFormValues.dueDate,
    notaFormValues.externalURI,
    notaFormValues.imageURI,
    notaFormValues.auditor,
    createLocalNota,
    toast,
    onSuccess,
    writeDirectPay,
    writeReversibleRelease,
    writeSimpleCash,
    sendEmail,
  ]);

  return { needsApproval, approveAmount, writeNota };
};
