import { useCallback } from "react";
import { useBlockchainData } from "../../context/BlockchainDataProvider";
import { CsvData } from "./useBatchPaymentReader";

interface Props {
  data: CsvData[];
}

const useDisperse = () => {
  const { blockchainState } = useBlockchainData();

  const disperseTokens = useCallback(
    async ({ data }: Props) => {
      const [tokens, values, recipients] = [
        data.map((val) => val.token),
        data.map((val) => val.value),
        data.map((val) => val.recipient),
      ];

      // TODO: map token to address
      const tx = await blockchainState.disperse.disperse(
        tokens,
        recipients,
        values
      );
      const receipt = await tx.wait();
      return receipt.transactionHash;
    },
    [blockchainState.disperse]
  );

  return { disperseTokens };
};

export default useDisperse;
