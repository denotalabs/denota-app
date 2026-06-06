import { useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import NotaRegistrar from "../frontend-abi/NotaRegistrar.json";
import { NotaActionContext } from "../utils/notaActions/types";
import { useTokens } from "./useTokens";

interface FundParams {
  escrow: string;
  instant: string;
}

function encodeFundHookData(
  moduleName: string,
  account: string
): string {
  if (
    moduleName === "reversibleRelease" ||
    moduleName === "reversibleByBeforeDate"
  ) {
    return ethers.utils.defaultAbiCoder.encode(["address"], [account]);
  }
  return "0x";
}

export function useFundNota(onSuccess?: () => void) {
  const toast = useToast();
  const { blockchainState } = useBlockchainData();
  const { currencyForTokenId, getTokenUnits } = useTokens();

  const fundNota = useCallback(
    async (ctx: NotaActionContext, { escrow, instant }: FundParams) => {
      const signer = blockchainState.signer;
      if (!signer || !blockchainState.registrarAddress) {
        throw new Error("Wallet not connected");
      }

      const token = currencyForTokenId(ctx.currency);
      const decimals = getTokenUnits(token);
      const escrowWei = escrow
        ? ethers.utils.parseUnits(escrow, decimals)
        : ethers.constants.Zero;
      const instantWei = instant
        ? ethers.utils.parseUnits(instant, decimals)
        : ethers.constants.Zero;

      if (escrowWei.isZero() && instantWei.isZero()) {
        throw new Error("Enter an escrow or instant amount");
      }

      const registrar = new ethers.Contract(
        blockchainState.registrarAddress,
        NotaRegistrar.abi,
        signer
      );

      const hookData = encodeFundHookData(
        ctx.moduleData.moduleName,
        blockchainState.account
      );

      try {
        const tx = await registrar.fund(
          ctx.id,
          escrowWei,
          instantWei,
          hookData
        );
        await tx.wait();

        toast({
          title: "Transaction succeeded",
          description: "Payment funded",
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
      blockchainState.account,
      blockchainState.registrarAddress,
      blockchainState.signer,
      currencyForTokenId,
      getTokenUnits,
      onSuccess,
      toast,
    ]
  );

  return { fundNota };
}
