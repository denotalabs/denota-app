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
      [ethers.utils.formatBytes32String(noteKey), blockchainState.account]
    );
    const tx = await blockchainState.cheq?.write(
      [
        "0xc5B6c09dc6595Eb949739f7Cd6A8d542C2aabF4b",
        amountWei,
        escrowedWei,
        blockchainState.account,
        address,
        blockchainState.directPayAddress,
        0,
      ],
      address,
      escrowedWei,
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
