import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../../components/designSystem/CurrencyIcon";

interface Props {
  token: NotaCurrency;
  amount: string;
  address: string;  // TODO change this to owner
  externalURI: string;
  imageURI: string;
  dueDate?: string;
}

export const useDirectPay = () => {
  const writeNota = useCallback(
    async ({
      // dueDate,
      token,
      amount,
      address,
      externalURI,
      imageURI,
    }: Props) => {
      console.log({ externalURI, imageURI });
      if (token === "UNKNOWN") {
        return;
      }
      const receipt = await write({
        currency: token,
        amount: Number(amount),
        instant: 0,
        owner: address,
        moduleName: "directSend",
        metadata: { type: "uploaded", externalURI, imageURI },
      });
      return receipt;
    },
    []
  );

  return { writeNota };
};
