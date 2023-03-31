import { useToast } from "@chakra-ui/react";
import { cash } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { useCheqContext } from "../context/CheqsContext";

interface Props {
  cheqId: string;
  type: "reversal" | "release";
  message: string;
}

export const useCashCheq = () => {
  const toast = useToast();
  const { refreshWithDelay } = useCheqContext();

  const cashCheq = useCallback(
    async ({ cheqId, type, message }: Props) => {
      try {
        await cash({ cheqId, type });
        toast({
          title: "Transaction succeeded",
          description: message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        refreshWithDelay();
      } catch (error) {
        console.log(error);
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

  return { cashCheq };
};
