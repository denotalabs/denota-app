import { useToast } from "@chakra-ui/react";
import { cash } from "@denota-labs/denota-sdk";
import { ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import NotaRegistrar from "../frontend-abi/NotaRegistrar.json";
import { isBalanceOfConditionalCashHook } from "../utils/balanceOfConditionalCash";
import { NotaActionContext } from "../utils/notaActions/types";
import { useTokens } from "./useTokens";

interface CashParams {
  escrow: string;
  to: string;
}

export function useCashNotaAction(onSuccess?: () => void) {
  const toast = useToast();
  const { blockchainState } = useBlockchainData();
  const { currencyForTokenId, getTokenUnits } = useTokens();

  const cashNota = useCallback(
    async (ctx: NotaActionContext, { escrow, to }: CashParams) => {
      const moduleName = ctx.moduleData.moduleName;
      if (moduleName === "directSend" || moduleName === "unknown") {
        return;
      }

      const token = currencyForTokenId(ctx.currency);
      const decimals = getTokenUnits(token);
      const amountWei = ethers.utils.parseUnits(escrow, decimals);

      if (!ethers.utils.isAddress(to)) {
        throw new Error("Invalid destination address");
      }

      try {
        if (
          isBalanceOfConditionalCashHook(
            ctx.hook,
            blockchainState.chainIdNumber
          )
        ) {
          const signer = blockchainState.signer;
          if (!signer || !blockchainState.registrarAddress) {
            throw new Error("Wallet not connected");
          }
          const registrar = new ethers.Contract(
            blockchainState.registrarAddress,
            NotaRegistrar.abi,
            signer
          );
          const tx = await registrar.cash(ctx.id, amountWei, to, "0x");
          await tx.wait();
        } else if (moduleName === "cashBeforeDateDrip") {
          const dripAmount =
            "dripAmount" in ctx.moduleData
              ? ctx.moduleData.dripAmount
              : amountWei;
          await cash({
            notaId: ctx.id,
            type: "reversal",
            amount: dripAmount,
            to: ctx.owner,
            moduleName,
          });
        } else {
          await cash({
            notaId: ctx.id,
            type: "release",
            amount: amountWei,
            to,
            moduleName,
          });
        }

        toast({
          title: "Transaction succeeded",
          description: "Escrow released",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onSuccess?.();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [
      blockchainState.chainIdNumber,
      blockchainState.registrarAddress,
      blockchainState.signer,
      currencyForTokenId,
      getTokenUnits,
      onSuccess,
      toast,
    ]
  );

  return { cashNota };
}
