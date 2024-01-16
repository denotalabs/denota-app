import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  dueDate?: string;
  token: string;
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
          creditor: isInvoice ? blockchainState.account : address,
          debitor: isInvoice ? address : blockchainState.account,
          dueDate,
        },
      });
      return receipt;
    },
    [blockchainState.account]
  );

  return { writeNota };
};
