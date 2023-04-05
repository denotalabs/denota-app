import { BigNumber, ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  tokenAddress: string;
  amountWei: BigNumber;
  address: string;
  escrowedWei: BigNumber;
  ipfsHash: string;
  imageUrl: string;
  isInvoice: boolean;
  inspector?: string;
}

export const useEscrowNota = () => {
  const { blockchainState } = useBlockchainData();

  const writeNota = useCallback(
    async ({
      tokenAddress,
      amountWei,
      address,
      escrowedWei,
      ipfsHash,
      isInvoice,
      inspector,
      imageUrl,
    }: Props) => {
      const debtor = isInvoice ? address : blockchainState.account;
      const notaInspector = inspector ?? debtor;

      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address", "address", "address", "uint256", "string", "string"],
        [
          address,
          notaInspector,
          blockchainState.account,
          amountWei,
          ipfsHash,
          imageUrl,
        ]
      );
      const msgValue =
        tokenAddress === "0x0000000000000000000000000000000000000000" &&
        !isInvoice
          ? escrowedWei
          : BigNumber.from(0);

      const tx = await blockchainState.notaRegistrar?.write(
        tokenAddress, //currency
        escrowedWei, //escrowed
        0, //instant
        isInvoice ? blockchainState.account : address, //owner
        blockchainState.escrowAddress, //module
        payload, //moduleWriteData
        { value: msgValue }
      );
      const receipt = await tx.wait();
      return receipt.transactionHash;
    },
    [
      blockchainState.account,
      blockchainState.notaRegistrar,
      blockchainState.escrowAddress,
    ]
  );

  return { writeNota };
};
