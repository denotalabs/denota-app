import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../../components/designSystem/CurrencyIcon";

interface Props {
  dueDate?: string;
  token: NotaCurrency;
  amount: string;
  address: string;
  externalUrl: string;
  imageUrl: string;
}

export const useDirectPay = () => {
  const writeNota = useCallback(
    async ({
      dueDate,
      token,
      amount,
      address,
      externalUrl,
      imageUrl,
    }: Props) => {
      console.log({ externalUrl, imageUrl });
      if (token === "UNKNOWN") {
        return;
      }
      const receipt = await write({
        amount: Number(amount),
        currency: token,
        metadata: { type: "uploaded", externalUrl, imageUrl },
        module: {
          moduleName: "direct",
          type: "payment",
          payee: address,
          dueDate,
        },
      });
      return receipt;
    },
    []
  );

  return { writeNota };
};
