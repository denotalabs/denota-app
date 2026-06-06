import { useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import NotaRegistrar from "../frontend-abi/NotaRegistrar.json";
import { getEffectiveAddress } from "../utils/ensAddress";
import { NotaActionContext } from "../utils/notaActions/types";

interface TransferParams {
  to: string;
  resolvedTo?: string;
}

export function useTransferNota(onSuccess?: () => void) {
  const toast = useToast();
  const { blockchainState } = useBlockchainData();

  const transferNota = useCallback(
    async (ctx: NotaActionContext, { to, resolvedTo }: TransferParams) => {
      const signer = blockchainState.signer;
      if (!signer || !blockchainState.registrarAddress) {
        throw new Error("Wallet not connected");
      }

      const recipient = getEffectiveAddress(to, resolvedTo);
      if (!ethers.utils.isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      const registrar = new ethers.Contract(
        blockchainState.registrarAddress,
        NotaRegistrar.abi,
        signer
      );

      try {
        const tx = await registrar.safeTransferFrom(
          ctx.owner,
          recipient,
          ctx.id,
          "0x"
        );
        await tx.wait();

        toast({
          title: "Transaction succeeded",
          description: "Nota transferred",
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
      blockchainState.registrarAddress,
      blockchainState.signer,
      onSuccess,
      toast,
    ]
  );

  return { transferNota };
}
