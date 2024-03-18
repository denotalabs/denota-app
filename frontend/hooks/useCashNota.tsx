import { useToast } from "@chakra-ui/react";
import { cash } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { useNotaContext } from "../context/NotasContext";
import { Nota } from "./useNotas";

interface Props {
  nota: Nota;
}

// TODO getting that the tx.waite isn't working. It's not returning a tx for some reason and wait won't work on null
export const useCashNota = () => {
  const toast = useToast();
  const { refreshWithDelay } = useNotaContext();

  const releaseNota = useCallback(
    async ({ nota }: Props) => {
      // TODO handle on SDK side
      if (nota.moduleData.moduleName === "directSend" || nota.moduleData.moduleName === "unknown") {
        return;
      }
      try {
        await cash({
          notaId: nota.id,
          type: "release", // NOTE: Isn't used in the SDK
          amount: nota.amountRaw,
          to: nota.receiver,
          moduleName: nota.moduleData.moduleName,
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
      if (nota.moduleData.moduleName === "directSend" || nota.moduleData.moduleName === "unknown") {
        return;
      }
      try {
        await cash({
          notaId: nota.id,
          type: "reversal", // NOTE: Isn't used in the SDK
          amount: nota.amountRaw,
          to: nota.sender,
          moduleName: nota.moduleData.moduleName,
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
