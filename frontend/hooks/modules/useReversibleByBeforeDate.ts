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
  inspector?: string;
  inspectionEndDate: string;
}

export const useReversibleByBeforeDate = () => {
  const writeNota = useCallback(
    async ({
      token,
      amount,
      address,
      inspector,
      externalURI,
      imageURI,
      inspectionEndDate,
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
        moduleName: "reversibleByBeforeDate",
        ...(inspector ? { inspector } : {}),
        reversibleByBeforeDate:
          Math.floor(expirationDateToCashBeforeDateMs(inspectionEndDate) / 1000),
      } as Parameters<typeof write>[0]);
      return receipt;
    },
    []
  );

  return { writeNota };
};
