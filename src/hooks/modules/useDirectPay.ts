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
  isInvoice: boolean;
}

export const useDirectPay = ({
  dueDate,
  tokenAddress,
  amountWei,
  address,
  escrowedWei,
  noteKey,
  isInvoice,
}: Props) => {
  const { blockchainState } = useBlockchainData();

  const writeCheq = useCallback(async () => {
    const payload = ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "uint256", "address", "bytes32"],
      [
        address,
        amountWei,
        0,
        blockchainState.account,
        ethers.utils.formatBytes32String(noteKey),
      ]
    );
    const tx = await blockchainState.cheq?.write(
      tokenAddress,
      0,
      escrowedWei,
      isInvoice ? blockchainState.account : address,
      blockchainState.directPayAddress,
      payload
    );
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }, [
    address,
    amountWei,
    blockchainState.account,
    blockchainState.cheq,
    blockchainState.directPayAddress,
    escrowedWei,
    isInvoice,
    noteKey,
    tokenAddress,
  ]);

  return { writeCheq };
};
