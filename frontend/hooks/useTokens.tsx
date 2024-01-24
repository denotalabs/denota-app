import { contractMappingForChainId } from "@denota-labs/denota-sdk";
import { ethers } from "ethers";
import { useCallback } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import erc20 from "../frontend-abi/ERC20.sol/TestERC20.json";

export const useTokens = () => {
  const { blockchainState } = useBlockchainData();

  const getTokenAddress = useCallback(
    (token: string) => {
      const mapping = contractMappingForChainId(blockchainState.chhainIdNumber);
      switch (token) {
        case "DAI":
          return mapping.dai;
        case "WETH":
          return mapping.weth;
        case "USDC":
          return mapping.usdc;
        case "NATIVE":
          return "0x0000000000000000000000000000000000000000";
        default:
          return "";
      }
    },
    [blockchainState]
  );

  const parseTokenValue = useCallback((token: string, value: number) => {
    switch (token) {
      case "WETH":
        return ethers.utils.parseEther(String(value));
      case "DAI":
        return ethers.utils.parseUnits(String(value), 18);
      case "USDC":
        return ethers.utils.parseUnits(String(value), 6);
      case "NATIVE":
        return ethers.utils.parseEther(String(value));
      default:
        return "";
    }
  }, []);

  const getTokenContract = useCallback(
    (token: string) => {
      const address = getTokenAddress(token);
      return new ethers.Contract(address, erc20.abi, blockchainState.signer);
    },
    [blockchainState.signer, getTokenAddress]
  );

  const getTokenUnits = useCallback((token: string) => {
    switch (token) {
      case "USDC":
        return 6;
      default:
        return 18;
    }
  }, []);

  const getTokenBalance = useCallback(
    async (token: string) => {
      const contract = getTokenContract(token);
      if (contract) {
        const rawBalance = await contract.balanceOf(blockchainState.account);
        const parsedBalance = ethers.utils.formatUnits(
          rawBalance,
          getTokenUnits(token)
        );
        return { rawBalance, parsedBalance };
      } else {
        return { rawBalance: 0, parsedBalance: "0" };
      }
    },
    [blockchainState.account, getTokenContract, getTokenUnits]
  );

  const getTokenAllowance = useCallback(
    async (token: string) => {
      const contract = getTokenContract(token);
      const rawBalance = await contract.allowance(
        blockchainState.account,
        blockchainState.registrarAddress
      );
      const parsedBalance = ethers.utils.formatUnits(
        rawBalance,
        getTokenUnits(token)
      );
      return { rawBalance, parsedBalance };
    },
    [
      blockchainState.account,
      blockchainState.registrarAddress,
      getTokenContract,
      getTokenUnits,
    ]
  );

  return {
    getTokenAddress,
    getTokenContract,
    parseTokenValue,
    getTokenBalance,
    getTokenAllowance,
  };
};
