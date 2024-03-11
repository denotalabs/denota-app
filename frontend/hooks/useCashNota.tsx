import { useToast } from "@chakra-ui/react";
import { cash } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { useNotaContext } from "../context/NotasContext";
import { Nota } from "./useNotas";

interface Props {
  nota: Nota;
}

export const useCashNota = () => {
  const toast = useToast();
  const { refreshWithDelay } = useNotaContext();

  const releaseNota = useCallback(
    async ({ nota }: Props) => {
      // TODO handle on SDK side
      if (nota.moduleData.module === "directSend" || nota.moduleData.module === "cashBeforeDateDrip" || nota.moduleData.module === "unknown") {
        return;
      }
      try {
        await cash({
          notaId: nota.id,
          type: "release", // NOTE: Isn't used in the SDK
          amount: nota.amountRaw,
          to: nota.receiver,
          module: nota.moduleData.module,
        });
        toast({
          title: "Transaction succeeded",
          description: "Payment released",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        refreshWithDelay();
      } catch (error) {
        console.error(error);
        toast({
          title: "Transaction failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [refreshWithDelay, toast]
  );

  const reverseNota = useCallback(
    async ({ nota }: Props) => {
      if (nota.moduleData.module === "directSend" || nota.moduleData.module === "cashBeforeDateDrip" || nota.moduleData.module === "unknown") {
        return;
      }
      try {
        await cash({
          notaId: nota.id,
          type: "reversal", // NOTE: Isn't used in the SDK
          amount: nota.amountRaw,
          to: nota.sender,
          module: nota.moduleData.module,
        });
        toast({
          title: "Transaction succeeded",
          description: "Payment voided",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        refreshWithDelay();
      } catch (error) {
        console.error(error);
        toast({
          title: "Transaction failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [refreshWithDelay, toast]
  );

  return { releaseNota, reverseNota };
};
