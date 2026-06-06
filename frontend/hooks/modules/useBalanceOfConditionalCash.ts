import { notaIdFromLog, state, tokenAddressForCurrency } from "@denota-labs/denota-sdk";
import { ethers } from "ethers";
import { useCallback } from "react";
import {
  NotaCurrency,
  sdkCurrencyFor,
} from "../../components/designSystem/CurrencyIcon";
import {
  balanceOfConditionalCashHookAddress,
  ConditionType,
  conditionTypeToEnum,
} from "../../utils/balanceOfConditionalCash";
import { expirationDateToCashBeforeDateMs } from "../../utils/expirationDate";
import { useTokens } from "../useTokens";

interface Props {
  token: NotaCurrency;
  amount: string;
  address: string;
  nftCollectionAddress: string;
  conditionType: ConditionType;
  nftBalanceThreshold: string;
  expirationDate: string;
  externalURI: string;
  imageURI: string;
}

export const useBalanceOfConditionalCash = () => {
  const { getTokenUnits } = useTokens();

  const writeNota = useCallback(
    async ({
      token,
      amount,
      address,
      nftCollectionAddress,
      conditionType,
      nftBalanceThreshold,
      expirationDate,
      externalURI,
      imageURI,
    }: Props) => {
      if (token === "UNKNOWN") {
        return;
      }

      const hookAddress = balanceOfConditionalCashHookAddress(
        state.blockchainState.chainId
      );

      const currency = sdkCurrencyFor(token);
      const amountWei = ethers.utils.parseUnits(amount, getTokenUnits(token));
      const expirationSeconds = Math.floor(
        expirationDateToCashBeforeDateMs(expirationDate) / 1000
      );

      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint8", "uint96", "uint256", "string", "string"],
        [
          nftCollectionAddress,
          conditionTypeToEnum(conditionType),
          expirationSeconds,
          ethers.BigNumber.from(nftBalanceThreshold),
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
        hookAddress,
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
