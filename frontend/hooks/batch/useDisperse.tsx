import { ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { useTokenAddress } from "../useTokenAddress";
import { CsvData } from "./useBatchPaymentReader";

interface Props {
  data: CsvData[];
}

const useDisperse = () => {
  const { blockchainState } = useBlockchainData();

  const { getTokenAddress, getTokenContract } = useTokenAddress();

  const disperseTokens = useCallback(
    async ({ data }: Props) => {
      const [tokens, values, recipients] = [
        data.map((val) => getTokenAddress(val.token)),
        data.map((val) => ethers.utils.parseEther(String(val.value))),
        data.map((val) => val.recipient),
      ];

      // const infinite = BigNumber.from(
      //   "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      // );

      // const approval1 = await getTokenContract("DAI")?.functions.approve(
      //   "0xa58AA04c66aF0e8A5B22e17a48EEA34405c526b5",
      //   infinite
      // );

      // const approval2 = await getTokenContract("WETH")?.functions.approve(
      //   "0xa58AA04c66aF0e8A5B22e17a48EEA34405c526b5",
      //   infinite
      // );

      // TODO: map token to address
      const tx = await blockchainState.disperse.disperse(
        tokens,
        recipients,
        values
      );
      const receipt = await tx.wait();
      return receipt.transactionHash;
    },
    [getTokenAddress, blockchainState.disperse]
  );

  return { disperseTokens };
};

export default useDisperse;
