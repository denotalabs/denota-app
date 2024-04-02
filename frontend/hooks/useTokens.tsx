import { contractMappingForChainId } from "@denota-labs/denota-sdk";
import { ethers } from "ethers";
import { useCallback } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import erc20 from "../frontend-abi/ERC20.sol/TestERC20.json";

export const useTokens = () => {
  const { blockchainState } = useBlockchainData();

  const getTokenAddress = useCallback(
    (token: NotaCurrency) => {
      const mapping = contractMappingForChainId(blockchainState.chhainIdNumber);
      switch (token) {
        case "DAI":
          return mapping.dai;
        case "WETH":
          return mapping.weth;
        case "USDC":
          return mapping.usdc;
        case "USDCE":
          return mapping.usdce;
        case "USDT":
          return mapping.usdt;
        default:
          return "";
      }
    },
    [blockchainState]
  );

  const displayNameForCurrency = useCallback((currency: NotaCurrency) => {
    switch (currency) {
      case "USDCE":
        return "USDC.e";
      case "UNKNOWN":
        return "Unknown Token";
    }
    return currency;
  }, []);

  const currencyForTokenId = useCallback(
    (tokenAddress: string): NotaCurrency => {
      const mapping = contractMappingForChainId(blockchainState.chhainIdNumber);

      switch (tokenAddress) {
        case mapping.dai.toLowerCase():
          return "DAI";
        case mapping.weth.toLowerCase():
          return "WETH";
        case mapping.usdc.toLocaleLowerCase():
          return "USDC";
        case mapping.usdce.toLocaleLowerCase():
          return "USDCE";
        case mapping.usdt.toLocaleLowerCase():
          return "USDT";
        default:
          return "UNKNOWN";
      }
    },
    [blockchainState.chhainIdNumber]
  );

  const getTokenUnits = useCallback((token: NotaCurrency) => {
    switch (token) {
      case "USDC":
      case "USDT":
      case "USDCE":
        return 6;
      default:
        return 18;
    }
  }, []);

  const parseTokenValue = useCallback(
    (token: NotaCurrency, value: number) => {
      const units = getTokenUnits(token);
      switch (token) {
        case "WETH":
          return ethers.utils.parseUnits(String(value), units);
        case "DAI":
          return ethers.utils.parseUnits(String(value), units);
        case "USDC":
          return ethers.utils.parseUnits(String(value), units);
        case "USDCE":
          return ethers.utils.parseUnits(String(value), units);
        case "USDT":
          return ethers.utils.parseUnits(String(value), units);
        default:
          return "";
      }
    },
    [getTokenUnits]
  );


  const weiAddressToDisplay = useCallback(
    (wei: ethers.BigNumber, token: string): string => {
      const units = getTokenUnits(currencyForTokenId(token));

      return ethers.utils.formatUnits(wei, units);
    },
    [getTokenUnits]
  );

  const getTokenContract = useCallback(
    (token: NotaCurrency) => {
      const address = getTokenAddress(token);
      return new ethers.Contract(address, erc20.abi, blockchainState.signer);
    },
    [blockchainState.signer, getTokenAddress]
  );

  const getTokenBalance = useCallback(
    async (token: NotaCurrency) => {
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
    async (token: NotaCurrency) => {
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
    getTokenUnits,
    currencyForTokenId,
    displayNameForCurrency,
    weiAddressToDisplay,
  };
};
