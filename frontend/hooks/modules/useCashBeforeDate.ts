import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import {
  NotaCurrency,
  sdkCurrencyFor,
} from "../../components/designSystem/CurrencyIcon";
import { expirationDateToCashBeforeDateMs } from "../../utils/expirationDate";

interface Props {
  token: NotaCurrency;
  amount: string;
  address: string;
  externalURI: string;
  imageURI: string;
  expirationDate: string;
}

export const useCashBeforeDate = () => {
  const writeNota = useCallback(
    async ({
      token,
      amount,
      address,
      externalURI,
      imageURI,
      expirationDate,
    }: Props) => {
      if (token === "UNKNOWN") {
        return;
      }
      const receipt = await write({
        currency: sdkCurrencyFor(token),
        amount: Number(amount),
        instant: 0,
        owner: address,
        metadata: { type: "uploaded", externalURI, imageURI },
        moduleName: "cashBeforeDate",
        cashBeforeDate: Math.floor(expirationDateToCashBeforeDateMs(expirationDate) / 1000),
      } as Parameters<typeof write>[0]);
      return receipt;
    },
    []
  );

  return { writeNota };
};
