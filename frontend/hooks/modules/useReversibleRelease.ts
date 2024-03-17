import { write } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { NotaCurrency } from "../../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  token: NotaCurrency;
  amount: string;
  address: string;
  externalURI: string;
  imageURI: string;
  inspector?: string;
}

export const useReversibleRelease = () => {
  const { blockchainState } = useBlockchainData();

  const writeNota = useCallback(
    async ({
      token,
      amount,
      address,
      inspector,
      externalURI,
      imageURI,
    }: Props) => {
      if (token === "UNKNOWN") {
        return;
      }
      const receipt = await write({
        currency: token,
        amount: Number(amount),
        instant: 0,
        owner: address,
        metadata: { type: "uploaded", externalURI, imageURI },
        moduleName: "reversibleRelease",
        ...(inspector ? { inspector } : { owner: address }),
      });
      return receipt;
    },
    [blockchainState.account]
  );

  return { writeNota };
};
