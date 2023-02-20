import { BigNumber, ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  dueDate?: string;
  tokenAddress: string;
  amountWei: BigNumber;
  address: string;
  escrowedWei: BigNumber;
  noteKey: string;
}

export const useDirectPay = ({
  dueDate,
  tokenAddress,
  amountWei,
  address,
  escrowedWei,
  noteKey,
}: Props) => {
  const { blockchainState } = useBlockchainData();

  const writeCheq = useCallback(async () => {
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["bytes32", "address"],
      [noteKey, blockchainState.account]
    );
    const tx = await blockchainState.cheq?.processWrite(
      [
        tokenAddress,
        amountWei,
        escrowedWei,
        blockchainState.account,
        address,
        blockchainState.directPayAddress,
        0,
      ],
      address,
      amountWei,
      payload
    );
    await tx.wait();
  }, [
    address,
    amountWei,
    blockchainState.account,
    blockchainState.cheq,
    blockchainState.directPayAddress,
    escrowedWei,
    noteKey,
    tokenAddress,
  ]);

  return { writeCheq };
};
