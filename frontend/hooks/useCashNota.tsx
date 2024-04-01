import { useToast } from "@chakra-ui/react";
import { Nota, cash } from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { useCallback } from "react";
import { useNotaContext } from "../context/NotasContext";

interface Props {
  nota: Nota;
}

// TODO use SDK for this and pass hook specific variables (Nota?)
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
        if (nota.moduleData.moduleName === "cashBeforeDateDrip") {
          let newAmount = BigNumber.from(nota.moduleData.dripAmount);
          await cash({
            notaId: nota.id,
            type: "reversal", // NOTE: Isn't used in the SDK
            amount: newAmount,
            to: nota.owner,
            moduleName: nota.moduleData.moduleName,
          });
        } else {
          await cash({
            notaId: nota.id,
            type: "release", // NOTE: Isn't used in the SDK
            amount: nota.escrowed,
            to: nota.owner,
            moduleName: nota.moduleData.moduleName,
          });
        }
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
          amount: nota.escrowed,
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
