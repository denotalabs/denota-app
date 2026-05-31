import { ethers } from "ethers";
import { useCallback } from "react";
import {
  currencyForSymbol,
  displayNameForCurrency as displayNameForCurrencyImpl,
  NotaCurrency,
} from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import {
  normalizeSymbol,
  useTokenList,
} from "../context/TokenListProvider";
import erc20 from "../frontend-abi/ERC20.sol/TestERC20.json";

const DEFAULT_DECIMALS = 18;

export const useTokens = () => {
  const { blockchainState } = useBlockchainData();
  const { bySymbol, byAddress } = useTokenList();

  const getTokenAddress = useCallback(
    (token: NotaCurrency) => {
      if (token === "UNKNOWN") {
        return "";
      }
      return bySymbol.get(normalizeSymbol(token))?.address ?? "";
    },
    [bySymbol]
  );

  const currencyForTokenId = useCallback(
    (tokenAddress: string): NotaCurrency => {
      const token = byAddress.get(tokenAddress.toLowerCase());
      if (!token) {
        return "UNKNOWN";
      }
      return currencyForSymbol(normalizeSymbol(token.symbol));
    },
    [byAddress]
  );

  const displayNameForCurrency = useCallback(
    (currency: NotaCurrency) => displayNameForCurrencyImpl(currency),
    []
  );

  const getTokenUnits = useCallback(
    (token: NotaCurrency) => {
      if (token === "UNKNOWN") {
        return DEFAULT_DECIMALS;
      }
      return bySymbol.get(normalizeSymbol(token))?.decimals ?? DEFAULT_DECIMALS;
    },
    [bySymbol]
  );

  const parseTokenValue = useCallback(
    (token: NotaCurrency, value: number) => {
      if (token === "UNKNOWN") {
        return "";
      }
      const units = getTokenUnits(token);
      return ethers.utils.parseUnits(String(value), units);
    },
    [getTokenUnits]
  );

  const weiAddressToDisplay = useCallback(
    (wei: ethers.BigNumber, token: string): string => {
      const units =
        byAddress.get(token.toLowerCase())?.decimals ?? DEFAULT_DECIMALS;
      return ethers.utils.formatUnits(wei, units);
    },
    [byAddress]
  );

  const getTokenContract = useCallback(
    (token: NotaCurrency) => {
      const address = getTokenAddress(token);
      if (!address) {
        return null;
      }
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
