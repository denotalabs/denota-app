import {
  AxelarQueryAPI,
  CHAINS,
  Environment,
} from "@axelar-network/axelarjs-sdk";
import { BigNumber } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { ContractAddressMapping } from "../../context/contractAddresses";

interface Props {
  dueDate?: string;
  tokenAddress: string;
  amountWei: BigNumber;
  address: string;
  ipfsHash: string;
  imageUrl: string;
}

export const useAxelarBridge = () => {
  const { blockchainState } = useBlockchainData();

  const writeCheq = useCallback(
    async ({ tokenAddress, amountWei, address, ipfsHash, imageUrl }: Props) => {
      const api = new AxelarQueryAPI({ environment: Environment.TESTNET });

      const axelarFeeString = await api.estimateGasFee(
        CHAINS.TESTNET["CELO"],
        CHAINS.TESTNET["POLYGON"],
        "CELO",
        300000,
        1.2
      );

      const axelarFee = BigNumber.from(axelarFeeString);

      const msgValue =
        tokenAddress === "0x0000000000000000000000000000000000000000"
          ? amountWei.add(axelarFee)
          : axelarFee;

      const tx = await blockchainState.axelarBridgeSender?.createRemoteNota(
        tokenAddress, //currency
        amountWei, //amount
        address, //owner
        ipfsHash,
        imageUrl,
        "Polygon", //destinationChain
        ContractAddressMapping.mumbai.bridgeReceiver,
        { value: msgValue }
      );
      const receipt = await tx.wait();
      return receipt.transactionHash;
    },
    [blockchainState.axelarBridgeSender]
  );

  return { writeCheq };
};
