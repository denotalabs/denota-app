import { useFundWallet } from "@privy-io/react-auth";
import { useCallback } from "react";
import type { Hex } from "viem";

import {
  NotaCurrency,
  displayNameForCurrency,
} from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { getChainConfig } from "../context/config/chains";
import { useNotaForm } from "../context/NotaFormProvider";
import { useTokens } from "./useTokens";

type PrivyFundAsset = "USDC" | "native-currency" | { erc20: Hex };

function privyAssetForToken(
  token: NotaCurrency,
  tokenAddress: string
): PrivyFundAsset | undefined {
  if (token === "USDC") {
    return "USDC";
  }
  if (tokenAddress) {
    return { erc20: tokenAddress as Hex };
  }
  return undefined;
}

export function purchaseLabelFor(token: NotaCurrency) {
  return `Purchase ${displayNameForCurrency(token)}`;
}

export function usePurchaseToken() {
  const { blockchainState } = useBlockchainData();
  const { getTokenAddress } = useTokens();
  const { setBalanceCheckCache } = useNotaForm();
  const { fundWallet } = useFundWallet({
    onUserExited: () => {
      setBalanceCheckCache(null);
    },
  });

  const purchaseToken = useCallback(
    async (token: NotaCurrency, amount: string) => {
      const address = blockchainState.account;
      if (!address || !amount) {
        return;
      }

      const chain = getChainConfig(blockchainState.chainIdNumber)?.chain;
      if (!chain) {
        return;
      }

      const asset = privyAssetForToken(token, getTokenAddress(token));
      if (!asset) {
        return;
      }

      await fundWallet({
        address,
        options: {
          chain,
          amount,
          asset,
        },
      });
    },
    [
      blockchainState.account,
      blockchainState.chainIdNumber,
      fundWallet,
      getTokenAddress,
    ]
  );

  const canPurchaseToken = useCallback(
    (token: NotaCurrency) =>
      Boolean(
        blockchainState.account &&
          getChainConfig(blockchainState.chainIdNumber)?.chain &&
          privyAssetForToken(token, getTokenAddress(token))
      ),
    [
      blockchainState.account,
      blockchainState.chainIdNumber,
      getTokenAddress,
    ]
  );

  return { purchaseToken, canPurchaseToken };
}
