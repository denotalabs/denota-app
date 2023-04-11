import { useToast } from "@chakra-ui/react";
import { cash } from "@denota-labs/denota-sdk";
import { useCallback } from "react";
import { useNotaContext } from "../context/NotasContext";

interface Props {
  cheqId: string;
}

export const useCash = () => {
  const toast = useToast();
  const { refreshWithDelay } = useNotaContext();

  const release = useCallback(
    async ({ cheqId }: Props) => {
      try {
        await cash({ cheqId, type: "release" });
        toast({
          title: "Transaction succeeded",
          description: "Payment released",
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

  const reverse = useCallback(
    async ({ cheqId }: Props) => {
      try {
        await cash({ cheqId, type: "reversal" });
        toast({
          title: "Transaction succeeded",
          description: "Payment voided",
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

  return { release, reverse };
};
