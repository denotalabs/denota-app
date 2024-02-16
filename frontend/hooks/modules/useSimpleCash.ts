import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  dueDate?: string;
  token: NotaCurrency;
  amount: string;
  address: string;
  externalUrl: string;
  imageUrl: string;
}

export const useSimpleCash = () => {
  const { blockchainState } = useBlockchainData();

  const writeNota = useCallback(
    async ({
      dueDate,
      token,
      amount,
      address,
      externalUrl,
      imageUrl,
    }: Props) => {
      if (token === "UNKNOWN") {
        return;
      }
      const receipt = await write({
        amount: Number(amount),
        currency: token,
        metadata: { type: "uploaded", externalUrl, imageUrl },
        module: {
          moduleName: "simpleCash",
          payee: address,
          payer: blockchainState.account,
        },
      });
      return receipt;
    },
    [blockchainState.account]
  );

  return { writeNota };
};
