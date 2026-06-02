import { useToast } from "@chakra-ui/react";
import { ModuleData } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useNotaForm } from "../context/NotaFormProvider";
import { useNotaContext } from "../context/NotasContext";
// TODO need to switch to SDK for these
import { useDirectPay } from "./modules/useDirectPay";
import { useReversibleRelease } from "./modules/useReversibleRelease";
import { useSimpleCash } from "./modules/useSimpleCash";
import { useEmail } from "./useEmail";
import { useRegistrarApproval } from "./useRegistrarApproval";

interface Props {
  onSuccess?: () => void;
}

// Asks for token approval if not already, tries writing nota and creates local version, sends email if provided
export const useConfirmNota = ({ onSuccess }: Props) => {
  const toast = useToast();

  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  const { sendEmail } = useEmail();

  const approvalEnabled = notaFormValues.mode === "pay";
  const { needsApproval, approveAmount } = useRegistrarApproval(
    approvalEnabled,
    notaFormValues.token,
    notaFormValues.amount
  );

  const { createLocalNota } = useNotaContext();

  const { writeNota: writeDirectPay } = useDirectPay();

  const { writeNota: writeReversibleRelease } = useReversibleRelease();

  const { writeNota: writeSimpleCash } = useSimpleCash();

  const writeNota = useCallback(async () => {
    try {
      const owner = notaFormValues.address;
      let receipt: { txHash: string; notaId: string };

      // TODO need to add more modules
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
          return;
      }

      // It takes a few seconds for the graph to pick up the new nota so go ahead and add it locally
      createLocalNota({
        id: receipt.notaId,
        token: notaFormValues.token as NotaCurrency,
        escrowed: notaFormValues.amount,
        module: notaFormValues.module,
        moduleData: notaFormValues.moduleData as ModuleData,
        sender: blockchainState.account,
        receiver: owner,
        instant: 0, // TODO this needs dynamic setting based on hook used
        owner: owner,
        createdHash: "",
        uri: notaFormValues.externalURI ?? "",
        isCrossChain: false,
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
  }, [
    blockchainState.account,
    blockchainState.chainId,
    notaFormValues.module,
    notaFormValues.address,
    notaFormValues.amount,
    notaFormValues.token,
    notaFormValues.email,
    notaFormValues.mode,
    notaFormValues.externalURI,
    notaFormValues.imageURI,
    notaFormValues.auditor,
    notaFormValues.moduleData,
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
