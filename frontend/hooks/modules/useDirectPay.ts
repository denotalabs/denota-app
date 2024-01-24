import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  dueDate?: string;
  token: NotaCurrency;
  amount: string;
  address: string;
  ipfsHash: string;
  imageUrl: string;
  isInvoice: boolean;
}

export const useDirectPay = () => {
  const { blockchainState } = useBlockchainData();

  const writeNota = useCallback(
    async ({
      dueDate,
      token,
      amount,
      address,
      ipfsHash,
      isInvoice,
      imageUrl,
    }: Props) => {
      const receipt = await write({
        amount: Number(amount),
        currency: token,
        metadata: { type: "uploaded", ipfsHash, imageUrl },
        module: {
          moduleName: "direct",
          type: isInvoice ? "invoice" : "payment",
          payee: isInvoice ? blockchainState.account : address,
          dueDate,
        },
      });
      return receipt;
    },
    [blockchainState.account]
  );

  return { writeNota };
};
