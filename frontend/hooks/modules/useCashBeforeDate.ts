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
  expirationDate: string;
}

export const useCashBeforeDate = () => {
  const { getTokenUnits } = useTokens();

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

      const currency = sdkCurrencyFor(token);
      const amountWei = ethers.utils.parseUnits(amount, getTokenUnits(token));
      const expirationSeconds = Math.floor(
        expirationDateToCashBeforeDateMs(expirationDate) / 1000
      );

      const payload = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "string", "string"],
        [expirationSeconds, externalURI ?? "", imageURI ?? ""]
      );

      const tokenAddress = tokenAddressForCurrency(currency) ?? "";
      const tx = await state.blockchainState.registrar?.write(
        tokenAddress,
        amountWei,
        0,
        address,
        state.blockchainState.contractMapping.cashBeforeDate,
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
