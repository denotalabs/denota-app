import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../../components/designSystem/CurrencyIcon";

interface Props {
  dueDate?: string;
  tokenAddress: string;
  amount: string;
  address: string;
  ipfsHash: string;
  imageUrl: string;
  token: string;
}

export const useAxelarBridge = () => {
  const writeNota = useCallback(
    async ({ token, amount, address, ipfsHash, imageUrl }: Props) => {
      const receipt = await write({
        metadata: { type: "uploaded", ipfsHash, imageUrl },
        module: {
          moduleName: "crosschain",
          creditor: address,
        },
        amount: Number(amount),
        currency: token as NotaCurrency,
      });
      return receipt;
    },
    []
  );

  return { writeNota };
};
