import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  token: NotaCurrency;
  amount: string;
  address: string;
  ipfsHash: string;
  imageUrl: string;
  inspector?: string;
}

export const useEscrowNota = () => {
  const { blockchainState } = useBlockchainData();

  const writeNota = useCallback(
    async ({
      token,
      amount,
      address,
      ipfsHash,
      inspector,
      imageUrl,
    }: Props) => {
      if (token === "UNKNOWN") {
        return;
      }
      const receipt = await write({
        amount: Number(amount),
        currency: token,
        metadata: { type: "uploaded", ipfsHash, imageUrl },
        module: {
          moduleName: "reversibleRelease",
          payee: address,
          payer: blockchainState.account,
          inspector,
        },
      });
      return receipt;
    },
    [blockchainState.account]
  );

  return { writeNota };
};
