import { useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useCallback } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { PaymentType } from "../components/write/details/PaymentTypeField";
import { paymentButtonText } from "../utils/paymentButtonText";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useDirectPay } from "./modules/useDirectPay";
import { useNotifyRecipient } from "./useNotifyRecipient";
import { normalizePaymentMetadataUris } from "../utils/metadataUri";
import { useTokens } from "./useTokens";

export interface QuickPaymentValues {
  token: NotaCurrency | string;
  amount: string;
  address: string;
  paymentType: PaymentType;
  note?: string;
  email?: string;
  phone?: string;
  file?: File;
  tags?: string;
  externalURI?: string;
  imageURI?: string;
  ipfsHash?: string;
}

interface Props {
  onSuccess?: () => void;
}

export const useQuickPayment = ({ onSuccess }: Props) => {
  const toast = useToast();
  const { blockchainState } = useBlockchainData();
  const { getTokenContract, getTokenUnits } = useTokens();
  const { writeNota: writeDirectPay } = useDirectPay();
  const { notifyRecipient } = useNotifyRecipient();

  const executeQuickPayment = useCallback(
    async (values: QuickPaymentValues) => {
      const token = values.token as NotaCurrency;
      if (token === "UNKNOWN") {
        return;
      }

      const amountWei = ethers.utils.parseUnits(
        values.amount,
        getTokenUnits(token)
      );
      const recipient = values.address;
      let txHash = "";

      try {
        switch (values.paymentType) {
          case "sendOnly":
            {
              const tokenContract = getTokenContract(token);
              if (!tokenContract) {
                throw new Error("Token contract unavailable");
              }
              const tx = await tokenContract.transfer(recipient, amountWei);
              const mined = await tx.wait();
              txHash = mined.transactionHash ?? tx.hash ?? "";
            }
            break;
          case "withReceipt": {
            const { externalURI, imageURI } = normalizePaymentMetadataUris({
              externalURI: values.externalURI ?? values.ipfsHash ?? "",
              imageURI: values.imageURI,
            });
            const receipt = await writeDirectPay({
              token,
              amount: values.amount,
              address: recipient,
              externalURI,
              imageURI,
            });
            if (!receipt) {
              return;
            }
            txHash = receipt.txHash ?? "";
            break;
          }
          default:
            return;
        }

        if (txHash) {
          await notifyRecipient({
            email: values.email,
            phone: values.phone,
            txHash,
            network: blockchainState.chainId,
            token: values.token,
            amount: values.amount,
            module:
              values.paymentType === "withReceipt" ? "directSend" : "sendOnly",
          });
        }

        toast({
          title: "Transaction succeeded",
          description: "Payment sent",
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
    },
    [
      blockchainState.chainId,
      getTokenContract,
      getTokenUnits,
      onSuccess,
      notifyRecipient,
      toast,
      writeDirectPay,
    ]
  );

  return { executeQuickPayment };
};

export function quickPaymentButtonText(
  paymentType: PaymentType,
  needsApproval: boolean,
  token: string,
  insufficientBalance = false,
  isCheckingReadiness = false
): string {
  return paymentButtonText({
    token,
    isCheckingReadiness,
    insufficientBalance,
    needsApproval,
    paymentType,
  });
}
