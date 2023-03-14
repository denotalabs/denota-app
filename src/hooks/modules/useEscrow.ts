import { BigNumber, ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  tokenAddress: string;
  amountWei: BigNumber;
  address: string;
  escrowedWei: BigNumber;
  noteKey: string;
  isInvoice: boolean;
}

export const useEscrow = () => {
  const { blockchainState } = useBlockchainData();

  const writeCheq = useCallback(
    async ({
      tokenAddress,
      amountWei,
      address,
      escrowedWei,
      noteKey,
      isInvoice,
    }: Props) => {
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256", "address", "string", "uint256"],
        [address, amountWei, 0, blockchainState.account, noteKey]
      );
      const tx = await blockchainState.cheq?.write(
        tokenAddress,
        0,
        escrowedWei,
        isInvoice ? blockchainState.account : address,
        blockchainState.escrowAddress,
        payload
      );
      const receipt = await tx.wait();
      return receipt.transactionHash;
    },
    [
      blockchainState.account,
      blockchainState.cheq,
      blockchainState.escrowAddress,
    ]
  );

  return { writeCheq };
};
