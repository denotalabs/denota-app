import { notaIdFromLog, state, tokenAddressForCurrency } from "@denota-labs/denota-sdk";
import { ethers } from "ethers";
import { useCallback } from "react";
import {
  NotaCurrency,
  sdkCurrencyFor,
} from "../../components/designSystem/CurrencyIcon";
import {
  DripPeriodPreset,
  DripPeriodUnit,
  resolveDripPeriodSeconds,
} from "../../utils/dripPeriod";
import { expirationDateToCashBeforeDateMs } from "../../utils/expirationDate";
import { useTokens } from "../useTokens";

interface Props {
  token: NotaCurrency;
  amount: string;
  address: string;
  expirationDate: string;
  dripAmount: string;
  dripPeriodPreset: DripPeriodPreset;
  dripPeriodAmount: string;
  dripPeriodUnit: DripPeriodUnit;
  externalURI: string;
  imageURI: string;
}

export const useCashBeforeDateDrip = () => {
  const { getTokenUnits } = useTokens();

  const writeNota = useCallback(
    async ({
      token,
      amount,
      address,
      expirationDate,
      dripAmount,
      dripPeriodPreset,
      dripPeriodAmount,
      dripPeriodUnit,
      externalURI,
      imageURI,
    }: Props) => {
      if (token === "UNKNOWN") {
        return;
      }

      const currency = sdkCurrencyFor(token);
      const amountWei = ethers.utils.parseUnits(amount, getTokenUnits(token));
      const dripAmountWei = ethers.utils.parseUnits(
        dripAmount,
        getTokenUnits(token)
      );
      const dripPeriod = resolveDripPeriodSeconds({
        dripPeriodPreset,
        dripPeriodAmount,
        dripPeriodUnit,
      });
      const expirationSeconds = Math.floor(
        expirationDateToCashBeforeDateMs(expirationDate) / 1000
      );

      const payload = ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint256", "string", "string"],
        [
          expirationSeconds,
          dripAmountWei,
          dripPeriod,
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
        state.blockchainState.contractMapping.cashBeforeDateDrip,
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
