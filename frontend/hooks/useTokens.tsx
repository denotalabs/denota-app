import { ethers } from "ethers";
import { useCallback } from "react";
import {
  currencyForSymbol,
  displayNameForCurrency as displayNameForCurrencyImpl,
  NotaCurrency,
  tokenListSymbolForCurrency,
} from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import {
  normalizeSymbol,
  useTokenList,
} from "../context/TokenListProvider";
import erc20 from "../frontend-abi/ERC20.sol/TestERC20.json";
import { truncateAddress } from "../utils/address";
import type { TokenInfo } from "../context/config/tokenList";

const DEFAULT_DECIMALS = 18;

type TokenKey = NotaCurrency | string;

function listedToken(
  token: TokenKey,
  bySymbol: Map<string, TokenInfo>,
  byAddress: Map<string, TokenInfo>
) {
  if (!token || token === "UNKNOWN") {
    return undefined;
  }
  if (ethers.utils.isAddress(token)) {
    return byAddress.get(token.toLowerCase());
  }
  return bySymbol.get(
    normalizeSymbol(tokenListSymbolForCurrency(token as NotaCurrency))
  );
}

export const useTokens = () => {
  const { blockchainState } = useBlockchainData();
  const { bySymbol, byAddress } = useTokenList();

  const getTokenAddress = useCallback(
    (token: TokenKey) => {
      if (!token || token === "UNKNOWN") {
        return "";
      }
      if (ethers.utils.isAddress(token)) {
        return ethers.utils.getAddress(token);
      }
      return listedToken(token, bySymbol, byAddress)?.address ?? "";
    },
    [byAddress, bySymbol]
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
    (currency: TokenKey) => {
      if (!currency) {
        return "";
      }
      if (ethers.utils.isAddress(currency)) {
        const token = byAddress.get(currency.toLowerCase());
        return token?.symbol ?? truncateAddress(currency);
      }
      return displayNameForCurrencyImpl(currency as NotaCurrency);
    },
    [byAddress]
  );

  const getTokenUnits = useCallback(
    (token: TokenKey) => {
      if (!token || token === "UNKNOWN") {
        return DEFAULT_DECIMALS;
      }
      return listedToken(token, bySymbol, byAddress)?.decimals ?? DEFAULT_DECIMALS;
    },
    [byAddress, bySymbol]
  );

  const parseTokenValue = useCallback(
    (token: TokenKey, value: number) => {
      if (!token || token === "UNKNOWN") {
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
    (token: TokenKey) => {
      const address = getTokenAddress(token);
      if (!address || !blockchainState.signer) {
        return null;
      }
      return new ethers.Contract(address, erc20.abi, blockchainState.signer);
    },
    [blockchainState.signer, getTokenAddress]
  );

  const getTokenBalance = useCallback(
    async (token: TokenKey) => {
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
    async (token: TokenKey) => {
      const contract = getTokenContract(token);
      if (!contract) {
        return { rawBalance: 0, parsedBalance: "0" };
      }
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
