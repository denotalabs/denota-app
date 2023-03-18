import { useToast } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useCheqContext } from "../context/CheqsContext";

interface Props {
  cheqId: string;
  amountWei: BigNumber;
  to: string;
  message: string;
}

export const useCashCheq = () => {
  const { blockchainState } = useBlockchainData();
  const toast = useToast();
  const { refreshWithDelay } = useCheqContext();

  const cashCheq = useCallback(
    async ({ cheqId, amountWei, to, message }: Props) => {
      try {
        const payload = ethers.utils.defaultAbiCoder.encode(
          ["address"],
          [blockchainState.account]
        );

        const tx = await blockchainState.cheq?.cash(
          cheqId,
          amountWei,
          to,
          payload
        );
        await tx.wait();
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
    [blockchainState.account, blockchainState.cheq, toast]
  );

  return { cashCheq };
};
