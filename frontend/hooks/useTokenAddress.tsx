import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";

export const useTokenAddress = () => {
  const { blockchainState } = useBlockchainData();

  const addressForToken = useCallback(
    (token: string) => {
      switch (token) {
        case "DAI":
          return blockchainState.dai?.address ?? "";
        case "WETH":
          return blockchainState.weth?.address ?? "";
        case "NATIVE":
          return "0x0000000000000000000000000000000000000000";
        default:
          return "";
      }
    },
    [blockchainState.dai, blockchainState.weth]
  );

  return { addressForToken };
};
