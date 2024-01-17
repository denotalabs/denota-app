import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";

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
        currency: token,
      });
      return receipt;
    },
    []
  );

  return { writeNota };
};
