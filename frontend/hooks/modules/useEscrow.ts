import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  token: string;
  amount: string;
  address: string;
  ipfsHash: string;
  imageUrl: string;
  isInvoice: boolean;
  inspector?: string;
}

export const useEscrow = () => {
  const { blockchainState } = useBlockchainData();

  const writeCheq = useCallback(
    async ({
      token,
      amount,
      address,
      ipfsHash,
      isInvoice,
      inspector,
      imageUrl,
    }: Props) => {
      const receipt = await write({
        amount: Number(amount),
        currency: token,
        module: {
          moduleName: "reversibleRelease",
          type: isInvoice ? "invoice" : "payment",
          creditor: isInvoice ? blockchainState.account : address,
          debitor: isInvoice ? address : blockchainState.account,
          ipfsHash,
          imageHash: imageUrl,
          inspector,
        },
      });
      return receipt;
    },
    [blockchainState.account]
  );

  return { writeCheq };
};
