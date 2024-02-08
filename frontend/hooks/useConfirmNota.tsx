import { useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useNotaForm } from "../context/NotaFormProvider";
import { useNotaContext } from "../context/NotasContext";
import { useDirectPay } from "./modules/useDirectPay";
import { useEscrowNota } from "./modules/useEscrowNota";
import { useSimpleCash } from "./modules/useSimpleCash";
import { useEmail } from "./useEmail";
import { useTokens } from "./useTokens";

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

  const { writeNota: writeEscrow } = useEscrowNota();

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
        let receipt: { txHash: string; notaId: string };

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
            receipt = await writeDirectPay({
              dueDate: notaFormValues.dueDate,
              amount: notaFormValues.amount,
              address: notaFormValues.address,
              ipfsHash: notaFormValues.ipfsHash ?? "",
              imageUrl: lighthouseUrl,
              token: notaFormValues.token,
            });

            break;

          case "escrow":
            receipt = await writeEscrow({
              token: notaFormValues.token,
              amount: notaFormValues.amount,
              address: notaFormValues.address,
              ipfsHash: notaFormValues.ipfsHash ?? "",
              inspector: notaFormValues.auditor,
              imageUrl: notaFormValues.imageUrl ?? "",
            });
            break;

          case "simpleCash":
            receipt = await writeSimpleCash({
              token: notaFormValues.token,
              amount: notaFormValues.amount,
              address: notaFormValues.address,
              ipfsHash: notaFormValues.ipfsHash ?? "",
              imageUrl: notaFormValues.imageUrl ?? "",
            });
            break;
          default:
            break;
        }

        const owner = notaFormValues.address;

        // It takes a few seconds for the graph to pick up the new nota so go ahead and add it locally
        createLocalNota({
          id: receipt.notaId,
          amount: Number(notaFormValues.amount),
          sender: blockchainState.account,
          receiver: notaFormValues.address,
          owner,
          token: notaFormValues.token as NotaCurrency,
          isCrossChain,
          createdHash: receipt.txHash,
          module: notaFormValues.module as "direct" | "escrow",
          uri: notaFormValues.ipfsHash,
        });

        if (receipt.txHash && notaFormValues.email) {
          await sendEmail({
            email: notaFormValues.email,
            txHash: receipt.txHash,
            network: blockchainState.chainId,
            token: notaFormValues.token,
            amount: notaFormValues.amount,
            module: "direct",
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
    notaFormValues.dueDate,
    notaFormValues.auditor,
    createLocalNota,
    toast,
    onSuccess,
    writeDirectPay,
    writeEscrow,
    writeSimpleCash,
    sendEmail,
  ]);

  return { needsApproval, approveAmount, writeNota };
};
