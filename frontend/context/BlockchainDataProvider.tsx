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

import MultiDisperse from "../frontend-abi/MultiDisperse.sol/MultiDisperse.json";
import {
  batchContractMappingForChainId,
  ChainInfo,
  chainInfoForChainId,
  chainNumberToChainHex,
} from "./chainInfo";

import { MetaMaskInpageProvider } from "@metamask/providers";

import { useAccount } from "wagmi";
import { useEthersSigner } from "./useEthersSigner";

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

interface BlockchainDataInterface {
  account: string;
  registrarAddress: string;
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
  registrarAddress: "",
  userDaiBalance: "",
  userWethBalance: "",
  signer: null,
  explorer: "",
  chainId: "",
  graphUrl: "",
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

    const ethersWalletInfo = useEthersSigner();

    const loadBlockchainData = useCallback(async () => {
      setIsInitializing(true);
      try {
        if (!ethersWalletInfo) {
          return;
        }

        const [provider, signer, account] = ethersWalletInfo; // console.log(provider, signer, account)
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
            chainId: chainNumberToChainHex(chainId),
            graphUrl: deployedChainInfo.graphUrl, // Change from graphUrlto graphTestUrl for testing a local graph node
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
    }, [ethersWalletInfo]);

    const { isConnected } = useAccount();

    useEffect(() => {
      if (!isConnected) {
        setIsInitializing(false);
      }
    }, [isConnected, loadBlockchainData]);

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
