import { useToast } from "@chakra-ui/react";
import { ModuleData } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useNotaForm } from "../context/NotaFormProvider";
import { useNotaContext } from "../context/NotasContext";
// TODO need to switch to SDK for these
import { getEffectiveAddress } from "../utils/ensAddress";
import { resolveWriteModule } from "../utils/resolveWriteModule";
import {
  defaultDripPeriodFormValues,
  DripPeriodPreset,
  DripPeriodUnit,
} from "../utils/dripPeriod";
import { useCashBeforeDate } from "./modules/useCashBeforeDate";
import { useCashBeforeDateDrip } from "./modules/useCashBeforeDateDrip";
import { useDirectPay } from "./modules/useDirectPay";
import { useReversibleByBeforeDate } from "./modules/useReversibleByBeforeDate";
import { useReversibleRelease } from "./modules/useReversibleRelease";
import { useSimpleCash } from "./modules/useSimpleCash";
import { useEmail } from "./useEmail";
interface Props {
  onSuccess?: () => void;
}

// Tries writing nota and creates local version, sends email if provided
export const useConfirmNota = ({ onSuccess }: Props) => {
  const toast = useToast();

  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  const { sendEmail } = useEmail();

  const { createLocalNota } = useNotaContext();

  const { writeNota: writeDirectPay } = useDirectPay();
  const { writeNota: writeCashBeforeDate } = useCashBeforeDate();
  const { writeNota: writeCashBeforeDateDrip } = useCashBeforeDateDrip();

  const { writeNota: writeReversibleRelease } = useReversibleRelease();
  const { writeNota: writeReversibleByBeforeDate } = useReversibleByBeforeDate();

  const { writeNota: writeSimpleCash } = useSimpleCash();

  const writeNota = useCallback(async () => {
    try {
      const owner = getEffectiveAddress(
        notaFormValues.address,
        notaFormValues.resolvedAddress
      );
      let receipt: { txHash: string; notaId: string };

      // TODO need to add more modules
      const resolvedModule = resolveWriteModule(notaFormValues);

      const inspector = notaFormValues.auditor?.trim()
        ? getEffectiveAddress(
            notaFormValues.auditor,
            notaFormValues.resolvedAuditor
          )
        : undefined;

      switch (resolvedModule) {
        case "cashBeforeDate":
          receipt = await writeCashBeforeDate({
            token: notaFormValues.token,
            amount: notaFormValues.amount,
            address: owner,
            expirationDate: notaFormValues.expirationDate,
            externalURI: notaFormValues.externalURI ?? "",
            imageURI: notaFormValues.imageURI ?? "",
          });
          break;
        case "directSend":
          receipt = await writeDirectPay({
            token: notaFormValues.token,
            amount: notaFormValues.amount,
            address: owner,
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
            inspector,
            externalURI: notaFormValues.externalURI ?? "",
            imageURI: notaFormValues.imageURI ?? "",
          });
          break;
        case "reversibleByBeforeDate":
          receipt = await writeReversibleByBeforeDate({
            token: notaFormValues.token,
            amount: notaFormValues.amount,
            address: owner,
            inspector,
            inspectionEndDate: notaFormValues.inspectionEndDate,
            externalURI: notaFormValues.externalURI ?? "",
            imageURI: notaFormValues.imageURI ?? "",
          });
          break;
        case "cashBeforeDateDrip":
          receipt = await writeCashBeforeDateDrip({
            token: notaFormValues.token,
            amount: notaFormValues.amount,
            address: owner,
            expirationDate: notaFormValues.expirationDate,
            dripAmount: notaFormValues.dripAmount,
            dripPeriodPreset: (notaFormValues.dripPeriodPreset ??
              defaultDripPeriodFormValues.dripPeriodPreset) as DripPeriodPreset,
            dripPeriodAmount:
              notaFormValues.dripPeriodAmount ??
              defaultDripPeriodFormValues.dripPeriodAmount,
            dripPeriodUnit: (notaFormValues.dripPeriodUnit ??
              defaultDripPeriodFormValues.dripPeriodUnit) as DripPeriodUnit,
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
        module: resolvedModule,
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
          module: resolvedModule,
        });
      }

      const message =
        notaFormValues.mode === "invoice"
          ? "Invoice created"
          : "Payment created";
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
    notaFormValues.resolvedAddress,
    notaFormValues.amount,
    notaFormValues.token,
    notaFormValues.email,
    notaFormValues.mode,
    notaFormValues.externalURI,
    notaFormValues.imageURI,
    notaFormValues.auditor,
    notaFormValues.resolvedAuditor,
    notaFormValues.expirationDate,
    notaFormValues.dripAmount,
    notaFormValues.dripPeriodPreset,
    notaFormValues.dripPeriodAmount,
    notaFormValues.dripPeriodUnit,
    notaFormValues.recoverableWhen,
    notaFormValues.inspectionEndDate,
    notaFormValues.moduleData,
    createLocalNota,
    toast,
    onSuccess,
    writeDirectPay,
    writeCashBeforeDate,
    writeCashBeforeDateDrip,
    writeReversibleRelease,
    writeReversibleByBeforeDate,
    writeSimpleCash,
    sendEmail,
  ]);

  return { writeNota };
};
