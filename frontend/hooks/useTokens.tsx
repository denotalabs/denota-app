import { ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import erc20 from "../frontend-abi/ERC20.sol/TestERC20.json";

export const useTokens = () => {
  const { blockchainState } = useBlockchainData();

  const getTokenAddress = useCallback(
    (token: string, chainId?: number) => {
      // TODO: move all token addresses to the SDK
      switch (true) {
        case chainId === 137 && token === "WETH":
          return "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619";
        case chainId === 137 && token === "DAI":
          return "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063";
        case chainId === 137 && token === "USDC":
          return "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
        case chainId === 1 && token === "WETH":
          return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
        case chainId === 1 && token === "DAI":
          return "0x6b175474e89094c44da98b954eedeac495271d0f";
        case chainId === 1 && token === "USDC":
          return "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
        case token === "DAI":
          return blockchainState.dai?.address ?? "";
        case token === "WETH":
          return blockchainState.weth?.address ?? "";
        case token === "NATIVE":
          return "0x0000000000000000000000000000000000000000";
        default:
          return "";
      }
    },
    [blockchainState]
  );

  const getTokenContract = useCallback(
    (token: string, chainId?: number) => {
      switch (true) {
        case chainId === 137 && token === "WETH":
          return new ethers.Contract(
            "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
            erc20.abi,
            blockchainState.signer
          );
        case chainId === 137 && token === "DAI":
          return new ethers.Contract(
            "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
            erc20.abi,
            blockchainState.signer
          );
        case chainId === 137 && token === "USDC":
          return new ethers.Contract(
            "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
            erc20.abi,
            blockchainState.signer
          );
        case chainId === 1 && token === "WETH":
          return new ethers.Contract(
            "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
            erc20.abi,
            blockchainState.signer
          );
        case chainId === 1 && token === "DAI":
          return new ethers.Contract(
            "0x6b175474e89094c44da98b954eedeac495271d0f",
            erc20.abi,
            blockchainState.signer
          );
        case chainId === 1 && token === "USDC":
          return new ethers.Contract(
            "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
            erc20.abi,
            blockchainState.signer
          );
        case token === "DAI":
          return blockchainState.dai;
        case token === "WETH":
          return blockchainState.weth;
        default:
          return undefined;
      }
    },
    [blockchainState.dai, blockchainState.signer, blockchainState.weth]
  );

  return { getTokenAddress, getTokenContract };
};
