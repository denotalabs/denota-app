import { useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useCallback } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useNotaForm } from "../context/NotaFormProvider";
import { useNotaContext } from "../context/NotasContext";
import { ConditionType } from "../utils/balanceOfConditionalCash";
import {
  defaultDripPeriodFormValues,
  DripPeriodPreset,
  DripPeriodUnit,
} from "../utils/dripPeriod";
import { getEffectiveAddress } from "../utils/ensAddress";
import { normalizePaymentMetadataUris } from "../utils/metadataUri";
import { buildOptimisticModuleData } from "../utils/notaActions/moduleDataFromTokenUri";
import { resolveWriteModule } from "../utils/resolveWriteModule";
import { useBalanceOfConditionalCash } from "./modules/useBalanceOfConditionalCash";
import { useCashBeforeDate } from "./modules/useCashBeforeDate";
import { useCashBeforeDateDrip } from "./modules/useCashBeforeDateDrip";
import { useDirectPay } from "./modules/useDirectPay";
import { useReversibleByBeforeDate } from "./modules/useReversibleByBeforeDate";
import { useReversibleRelease } from "./modules/useReversibleRelease";
import { useSimpleCash } from "./modules/useSimpleCash";
import { useNotifyRecipient } from "./useNotifyRecipient";
import { useTokens } from "./useTokens";

interface Props {
  onSuccess?: () => void;
}

// Tries writing nota and creates local version, sends email if provided
export const useConfirmNota = ({ onSuccess }: Props) => {
  const toast = useToast();

  const { notaFormValues } = useNotaForm();
  const { blockchainState } = useBlockchainData();

  const { notifyRecipient } = useNotifyRecipient();
  const { getTokenUnits } = useTokens();

  const { createLocalNota } = useNotaContext();

  const { writeNota: writeDirectPay } = useDirectPay();
  const { writeNota: writeCashBeforeDate } = useCashBeforeDate();
  const { writeNota: writeCashBeforeDateDrip } = useCashBeforeDateDrip();

  const { writeNota: writeReversibleRelease } = useReversibleRelease();
  const { writeNota: writeReversibleByBeforeDate } = useReversibleByBeforeDate();

  const { writeNota: writeSimpleCash } = useSimpleCash();
  const { writeNota: writeBalanceOfConditionalCash } =
    useBalanceOfConditionalCash();

  const writeNota = useCallback(async () => {
    try {
      const owner = getEffectiveAddress(
        notaFormValues.address,
        notaFormValues.resolvedAddress
      );
      if (!ethers.utils.isAddress(owner)) {
        toast({
          title: "Recipient address is not resolved",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const { externalURI, imageURI } = normalizePaymentMetadataUris(
        notaFormValues
      );
      let receipt: { txHash: string; notaId: string } | undefined;

      const resolvedModule = resolveWriteModule(notaFormValues);
      if (!resolvedModule) {
        toast({
          title: "Payment terms are not ready to write",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const token = notaFormValues.token as NotaCurrency;
      const amount = String(notaFormValues.amount ?? "").trim();
      const amountWei = ethers.utils.parseUnits(amount, getTokenUnits(token));

      const inspectorRaw = notaFormValues.auditor?.trim()
        ? getEffectiveAddress(
            notaFormValues.auditor,
            notaFormValues.resolvedAuditor
          )
        : blockchainState.account || undefined;
      const inspector =
        inspectorRaw && ethers.utils.isAddress(inspectorRaw)
          ? inspectorRaw
          : undefined;

      if (
        (resolvedModule === "reversibleRelease" ||
          resolvedModule === "reversibleByBeforeDate") &&
        !inspector
      ) {
        toast({
          title: "Reviewer address is not resolved",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const dripAmount = String(notaFormValues.dripAmount ?? "").trim();
      let dripAmountWei: ReturnType<typeof ethers.utils.parseUnits> | undefined;
      if (resolvedModule === "cashBeforeDateDrip") {
        dripAmountWei = ethers.utils.parseUnits(
          dripAmount,
          getTokenUnits(token)
        );
      }

      switch (resolvedModule) {
        case "cashBeforeDate":
          receipt = await writeCashBeforeDate({
            token,
            amount,
            address: owner,
            expirationDate: notaFormValues.expirationDate,
            externalURI,
            imageURI,
          });
          break;
        case "directSend":
          receipt = await writeDirectPay({
            token,
            amount,
            address: owner,
            externalURI,
            imageURI,
          });
          break;
        case "simpleCash":
          receipt = await writeSimpleCash({
            token,
            amount,
            address: owner,
            externalURI,
            imageURI,
          });
          break;
        case "reversibleRelease":
          receipt = await writeReversibleRelease({
            token,
            amount,
            address: owner,
            inspector,
            externalURI,
            imageURI,
          });
          break;
        case "reversibleByBeforeDate":
          receipt = await writeReversibleByBeforeDate({
            token,
            amount,
            address: owner,
            inspector,
            inspectionEndDate: notaFormValues.inspectionEndDate,
            externalURI,
            imageURI,
          });
          break;
        case "balanceOfConditionalCash":
          receipt = await writeBalanceOfConditionalCash({
            token,
            amount,
            address: owner,
            nftCollectionAddress: notaFormValues.nftCollectionAddress,
            conditionType: notaFormValues.conditionType as ConditionType,
            nftBalanceThreshold: notaFormValues.nftBalanceThreshold,
            expirationDate: notaFormValues.expirationDate,
            externalURI,
            imageURI,
          });
          break;
        case "cashBeforeDateDrip":
          receipt = await writeCashBeforeDateDrip({
            token,
            amount,
            address: owner,
            expirationDate: notaFormValues.expirationDate,
            dripAmount,
            dripPeriodPreset: (notaFormValues.dripPeriodPreset ??
              defaultDripPeriodFormValues.dripPeriodPreset) as DripPeriodPreset,
            dripPeriodAmount: String(
              notaFormValues.dripPeriodAmount ??
                defaultDripPeriodFormValues.dripPeriodAmount
            ).trim(),
            dripPeriodUnit: (notaFormValues.dripPeriodUnit ??
              defaultDripPeriodFormValues.dripPeriodUnit) as DripPeriodUnit,
            externalURI,
            imageURI,
          });
          break;
        default:
          toast({
            title: "Payment terms are not ready to write",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          return;
      }

      if (!receipt?.notaId) {
        toast({
          title: "Transaction failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      createLocalNota({
        id: receipt.notaId,
        token,
        escrowed: amountWei.toString(),
        module: resolvedModule,
        moduleData: buildOptimisticModuleData({
          module: resolvedModule,
          escrowWei: amountWei,
          owner,
          account: blockchainState.account,
          inspector,
          expirationDate: notaFormValues.expirationDate,
          inspectionEndDate: notaFormValues.inspectionEndDate,
          dripAmountWei,
          nftCollectionAddress: notaFormValues.nftCollectionAddress,
          conditionType: notaFormValues.conditionType,
          nftBalanceThreshold: notaFormValues.nftBalanceThreshold,
          sender: blockchainState.account,
          externalURI,
          imageURI,
        }),
        sender: blockchainState.account,
        receiver: owner,
        instant: 0,
        owner,
        createdHash: receipt.txHash ?? "",
        uri: externalURI,
        inspector,
        isCrossChain: false,
      });

      if (receipt.txHash) {
        await notifyRecipient({
          email: notaFormValues.email,
          phone: notaFormValues.phone,
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
    notaFormValues.phone,
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
    notaFormValues.nftCollectionAddress,
    notaFormValues.conditionType,
    notaFormValues.nftBalanceThreshold,
    createLocalNota,
    getTokenUnits,
    toast,
    onSuccess,
    writeDirectPay,
    writeCashBeforeDate,
    writeCashBeforeDateDrip,
    writeReversibleRelease,
    writeReversibleByBeforeDate,
    writeSimpleCash,
    writeBalanceOfConditionalCash,
    notifyRecipient,
  ]);

  return { writeNota };
};
