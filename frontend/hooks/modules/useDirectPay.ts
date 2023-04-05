import { BigNumber, ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";

interface Props {
  dueDate?: string;
  tokenAddress: string;
  amountWei: BigNumber;
  address: string;
  instantWei: BigNumber;
  ipfsHash: string;
  imageUrl: string;
  isInvoice: boolean;
}

export const useDirectPay = () => {
  const { blockchainState } = useBlockchainData();

  const writeNota = useCallback(
    async ({
      dueDate,
      tokenAddress,
      amountWei,
      address,
      instantWei,
      ipfsHash,
      isInvoice,
      imageUrl,
    }: Props) => {
      const utcOffset = new Date().getTimezoneOffset();

      let dueTimestamp: number;

      if (dueDate) {
        dueTimestamp =
          Date.parse(`${dueDate}T00:00:00Z`) / 1000 + utcOffset * 60;
      } else {
        const d = new Date();
        const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 10);
        dueTimestamp = Date.parse(`${today}T00:00:00Z`) / 1000 + utcOffset * 60;
      }

      // TODO: handle image key
      const payload = ethers.utils.defaultAbiCoder.encode(
        ["address", "uint256", "uint256", "address", "string", "string"],
        [
          address,
          amountWei,
          dueTimestamp,
          blockchainState.account,
          imageUrl,
          ipfsHash,
        ]
      );
      const msgValue =
        tokenAddress === "0x0000000000000000000000000000000000000000" &&
        !isInvoice
          ? instantWei
          : BigNumber.from(0);

      const tx = await blockchainState.notaRegistrar?.write(
        tokenAddress, //currency
        0, //escrowed
        instantWei, //instant
        isInvoice ? blockchainState.account : address, //owner
        blockchainState.directPayAddress, //module
        payload, //moduleWriteData
        { value: msgValue }
      );
      const receipt = await tx.wait();
      return receipt.transactionHash;
    },
    [
      blockchainState.account,
      blockchainState.notaRegistrar,
      blockchainState.directPayAddress,
    ]
  );

  return { writeNota };
};
