import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";

import {
  contractMappingForChainId,
  setProvider,
} from "@denota-labs/denota-sdk";

import {
  createSponsoredEthersSigner,
  isGasSponsoredForWallet,
} from "../lib/sponsoredEthersSigner";
import MultiDisperse from "../frontend-abi/MultiDisperse.sol/MultiDisperse.json";
import {
  batchContractMappingForChainId,
  blockExplorerTxBasesFor,
  chainNumberToChainHex,
  DEFAULT_CHAIN_ID,
  DenotaChainConfig,
  getChainConfig,
} from "./config/chains";

interface BlockchainDataInterface {
  account: string;
  registrarAddress: string;
  signer: null | ethers.Signer;
  explorer: string;
  chainId: string;
  chainIdNumber: number;
  graphUrl: string;
  nativeCurrencySymbol: string;
  disperse: null | ethers.Contract;
}

interface BlockchainDataContextInterface {
  blockchainState: BlockchainDataInterface;
  isInitializing: boolean;
  connectWallet?: () => Promise<void>;
  isWrongChain: boolean;
}

const defaultBlockchainState: BlockchainDataInterface = {
  account: "",
  registrarAddress: "",
  signer: null,
  explorer: "",
  chainId: "",
  graphUrl: "",
  nativeCurrencySymbol: "",
  disperse: null,
  chainIdNumber: 0,
};

const BlockchainDataContext = createContext<BlockchainDataContextInterface>({
  blockchainState: defaultBlockchainState,
  isInitializing: true,
  isWrongChain: false,
});

async function applySignerToState(
  signer: ethers.Signer,
  account: string,
  chainId: number,
  setBlockchainState: React.Dispatch<
    React.SetStateAction<BlockchainDataInterface>
  >,
  setIsInitializing: (v: boolean) => void,
  setIsWrongChain: (v: boolean) => void
) {
  try {
    await setProvider({ signer, chainId });
  } catch (error) {
    console.error(error);
  }

  const contractMapping = contractMappingForChainId(chainId);
  const deployedChainInfo: DenotaChainConfig | undefined =
    getChainConfig(chainId);

  if (contractMapping === undefined || deployedChainInfo === undefined) {
    setIsInitializing(false);
    setIsWrongChain(true);
    setBlockchainState({
      ...defaultBlockchainState,
      account,
      chainId: chainNumberToChainHex(chainId),
      signer,
      chainIdNumber: chainId,
    });
    return;
  }

  const batchContract = batchContractMappingForChainId(chainId);
  const disperse = batchContract
    ? new ethers.Contract(batchContract, MultiDisperse.abi, signer)
    : null;

  const firstBlockExplorer =
    blockExplorerTxBasesFor(deployedChainInfo)[0] ?? "";

  setBlockchainState({
    signer,
    account,
    registrarAddress: contractMapping.registrar,
    explorer: firstBlockExplorer,
    chainId: chainNumberToChainHex(chainId),
    graphUrl: deployedChainInfo.graphUrl,
    nativeCurrencySymbol:
      deployedChainInfo.chain.nativeCurrency?.symbol ?? "",
    disperse,
    chainIdNumber: chainId,
  });
  setIsInitializing(false);
  setIsWrongChain(false);
}

function resetDisconnectedState(
  setBlockchainState: React.Dispatch<
    React.SetStateAction<BlockchainDataInterface>
  >,
  setIsInitializing: (v: boolean) => void,
  setIsWrongChain: (v: boolean) => void
) {
  const deployedChainInfo = getChainConfig(DEFAULT_CHAIN_ID);
  setBlockchainState({
    ...defaultBlockchainState,
    chainId: chainNumberToChainHex(DEFAULT_CHAIN_ID),
    chainIdNumber: DEFAULT_CHAIN_ID,
    graphUrl: deployedChainInfo?.graphUrl ?? "",
    nativeCurrencySymbol:
      deployedChainInfo?.chain.nativeCurrency?.symbol ?? "",
  });
  setIsWrongChain(false);
  setIsInitializing(false);
}

export const BlockchainDataProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    const [blockchainState, setBlockchainState] =
      useState<BlockchainDataInterface>(defaultBlockchainState);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isWrongChain, setIsWrongChain] = useState(false);
    const hasCompletedInitialLoad = useRef(false);

    const { ready, authenticated, login } = usePrivy();
    const { wallets } = useWallets();
    const { sendTransaction: privySendTransaction } = useSendTransaction();

    const loadBlockchainData = useCallback(
      async (options?: { switchToDefaultChain?: boolean }) => {
        const wallet = wallets[0];
        if (!wallet) {
          return;
        }

        if (!hasCompletedInitialLoad.current) {
          setIsInitializing(true);
        }
        try {
          if (options?.switchToDefaultChain) {
            await wallet.switchChain(DEFAULT_CHAIN_ID);
          }

          const eip1193 = await wallet.getEthereumProvider();
          const provider = new ethers.providers.Web3Provider(eip1193, "any");
          const baseSigner = provider.getSigner();
          const account = await baseSigner.getAddress();
          const { chainId } = await provider.getNetwork();

          const useSponsoredGas = isGasSponsoredForWallet(
            wallet.walletClientType
          );

          const signer = useSponsoredGas
            ? createSponsoredEthersSigner(baseSigner, privySendTransaction, {
                sponsor: true,
                walletAddress: account,
              })
            : baseSigner;

          await applySignerToState(
            signer,
            account,
            chainId,
            setBlockchainState,
            setIsInitializing,
            setIsWrongChain
          );
          hasCompletedInitialLoad.current = true;
        } catch (e) {
          console.error(e);
          window.alert("Error loading contracts");
          setIsInitializing(false);
        }
      },
      [privySendTransaction, wallets]
    );

    const connectWallet = useCallback(async () => {
      if (!ready) {
        return;
      }
      if (!authenticated) {
        login();
        return;
      }
      await loadBlockchainData({ switchToDefaultChain: true });
    }, [authenticated, loadBlockchainData, login, ready]);

    useEffect(() => {
      if (!ready) {
        return;
      }

      if (!authenticated) {
        hasCompletedInitialLoad.current = false;
        resetDisconnectedState(
          setBlockchainState,
          setIsInitializing,
          setIsWrongChain
        );
        return;
      }

      if (wallets[0]) {
        loadBlockchainData();
      }
    }, [ready, authenticated, wallets, loadBlockchainData]);

    return (
      <BlockchainDataContext.Provider
        value={{
          blockchainState,
          connectWallet,
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
