import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { ethers } from "ethers";

import {
  contractMappingForChainId,
  setProvider,
} from "@denota-labs/denota-sdk";
// TODO: remove references to cheq from contracts
import type { WalletState } from "@web3-onboard/core";
import { useConnectWallet, useWallets } from "@web3-onboard/react";

import MultiDisperse from "../frontend-abi/MultiDisperse.sol/MultiDisperse.json";
import {
  batchContractMappingForChainId,
  ChainInfo,
  chainInfoForChainId,
  chainNumberToChainHex,
} from "./chainInfo";

import { MetaMaskInpageProvider } from "@metamask/providers";

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

interface BlockchainDataInterface {
  account: string;
  registrarAddress: string;
  directPayAddress: string;
  escrowAddress: string;
  simpleCashAddress: string;
  signer: null | ethers.providers.JsonRpcSigner;
  explorer: string;
  chainId: string;
  chhainIdNumber: number;
  graphUrl: string;
  nativeCurrenySymbol: string;
  disperse: null | ethers.Contract;
}

interface BlockchainDataContextInterface {
  blockchainState: BlockchainDataInterface;
  isInitializing: boolean;
  connectWallet?: () => Promise<void>;
  isWrongChain: boolean;
}

const defaultBlockchainState = {
  account: "",
  dai: null,
  weth: null,
  axelarBridgeSender: null,
  registrarAddress: "",
  userDaiBalance: "",
  userWethBalance: "",
  signer: null,
  explorer: "",
  directPayAddress: "",
  chainId: "",
  graphUrl: "",
  escrowAddress: "",
  nativeCurrenySymbol: "",
  walletBalance: "",
  disperse: null,
  chhainIdNumber: 0,
  simpleCashAddress: "",
};

const BlockchainDataContext = createContext<BlockchainDataContextInterface>({
  blockchainState: defaultBlockchainState,
  isInitializing: true,
  isWrongChain: false,
});

export const BlockchainDataProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    const [blockchainState, setBlockchainState] =
      useState<BlockchainDataInterface>(defaultBlockchainState);

    const [isInitializing, setIsInitializing] = useState(true);
    const [isWrongChain, setIsWrongChain] = useState(false);

    const [, connect] = useConnectWallet();
    const connectedWallets = useWallets();

    const connectWalletWeb3Modal = useCallback(async () => {
      let wallet: WalletState;

      if (connectedWallets[0]) {
        wallet = connectedWallets[0];
      } else {
        const wallets = await connect();
        wallet = wallets[0];
      }
      const provider = new ethers.providers.Web3Provider(
        wallet.provider,
        "any"
      );
      const signer = provider.getSigner(); //console.log(provider)
      const account = await signer.getAddress(); //console.log(account)

      return [provider, signer, account] as [
        ethers.providers.Web3Provider,
        ethers.providers.JsonRpcSigner,
        string
      ];
    }, [connect, connectedWallets]);

    const loadBlockchainData = useCallback(async () => {
      if (
        connectedWallets &&
        connectedWallets.length > 0 &&
        connectedWallets[0].chains[0].id === blockchainState.chainId
      ) {
        return;
      }
      setIsInitializing(true);
      try {
        const [provider, signer, account] = await connectWalletWeb3Modal(); // console.log(provider, signer, account)
        const { chainId } = await provider.getNetwork();

        try {
          await setProvider({
            signer,
            chainId,
          });
        } catch (error) {
          console.log(error);
        }

        window.ethereum?.on("chainChanged", () => {
          if (window.location.pathname !== "/batch/") {
            document.location.reload();
          }
        });

        window.ethereum?.on("accountsChanged", () => {
          if (window.location.pathname !== "/batch/") {
            document.location.reload();
          }
        });
        const contractMapping = contractMappingForChainId(chainId);
        const deployedChainInfo: ChainInfo = chainInfoForChainId(chainId);

        if (contractMapping === undefined || deployedChainInfo == undefined) {
          setIsInitializing(false);
          setIsWrongChain(true);
          setBlockchainState({
            ...defaultBlockchainState,
            account,
            chainId: chainNumberToChainHex(chainId),
            signer,
          });
        } else {
          const batchContract = batchContractMappingForChainId(chainId);

          const disperse = batchContract
            ? new ethers.Contract(batchContract, MultiDisperse.abi, signer)
            : null;

          const firstBlockExplorer = deployedChainInfo.blockExplorerUrls[0];
          // Load contracts
          setBlockchainState({
            signer,
            account,
            registrarAddress: contractMapping.registrar,
            explorer: firstBlockExplorer,
            directPayAddress: contractMapping.directPay,
            simpleCashAddress: contractMapping.simpleCash,
            chainId: chainNumberToChainHex(chainId),
            graphUrl: deployedChainInfo.graphUrl, // Change from graphUrlto graphTestUrl for testing a local graph node
            escrowAddress: contractMapping.reversibleRelease, // TODO: deploy escrow
            nativeCurrenySymbol: deployedChainInfo.nativeCurrency?.symbol ?? "",
            disperse,
            chhainIdNumber: chainId,
          });
          setIsInitializing(false);
        }
      } catch (e) {
        console.log("error", e);
        window.alert("Error loading contracts");
        setIsInitializing(false);
      }
    }, [blockchainState.chainId, connectWalletWeb3Modal, connectedWallets]);

    useEffect(() => {
      const lastWallet = localStorage.getItem(
        "onboard.js:last_connected_wallet"
      );
      if (lastWallet && lastWallet !== "[]" && !connectedWallets[0]) {
        // There is a wallet but onboardJS hasn't loaded it yet. Stay in the loading state
        return;
      }
      if (connectedWallets[0]) {
        loadBlockchainData();
      } else {
        setIsInitializing(false);
      }
    }, [connectedWallets, loadBlockchainData]);

    return (
      <BlockchainDataContext.Provider
        value={{
          blockchainState,
          connectWallet: loadBlockchainData,
          isInitializing,
          isWrongChain,
        }}
      >
        {children}
      </BlockchainDataContext.Provider>
    );
  }
);

export function useBlockchainData() {
  return useContext(BlockchainDataContext);
}
