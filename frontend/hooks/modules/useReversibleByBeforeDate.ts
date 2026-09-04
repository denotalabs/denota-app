import { notaIdFromLog, state, tokenAddressForCurrency } from "@denota-labs/denota-sdk";
import { ethers } from "ethers";
import { useCallback } from "react";
import {
  NotaCurrency,
  sdkCurrencyFor,
} from "../../components/designSystem/CurrencyIcon";
import { expirationDateToCashBeforeDateMs } from "../../utils/expirationDate";
import { useTokens } from "../useTokens";

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
  const { getTokenUnits } = useTokens();

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

      const currency = sdkCurrencyFor(token);
      const amountWei = ethers.utils.parseUnits(amount, getTokenUnits(token));
      const inspectionEndSeconds = Math.floor(
        expirationDateToCashBeforeDateMs(inspectionEndDate) / 1000
      );
      const inspectorAddress = inspector?.trim() || address;

      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "string", "string"],
        [
          inspectorAddress,
          inspectionEndSeconds,
          externalURI ?? "",
          imageURI ?? "",
        ]
      );

      const tokenAddress = tokenAddressForCurrency(currency) ?? "";
      const tx = await state.blockchainState.registrar?.write(
        tokenAddress,
        amountWei,
        0,
        address,
        state.blockchainState.contractMapping.reversibleByBeforeDate,
        payload,
        { value: 0 }
      );
      const receipt = await tx.wait();

      return {
        txHash: receipt.transactionHash as string,
        notaId: notaIdFromLog(receipt),
      };
    },
    [getTokenUnits]
  );

  return { writeNota };
};
