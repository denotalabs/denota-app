import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { BigNumber, ethers } from "ethers";

import {
  contractMappingForChainId,
  setProvider,
} from "@denota-labs/denota-sdk";
// TODO: remove references to cheq from contracts
import type { WalletState } from "@web3-onboard/core";
import { useConnectWallet, useWallets } from "@web3-onboard/react";

import erc20 from "../frontend-abi/ERC20.sol/TestERC20.json";
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
  dai: null | ethers.Contract;
  weth: null | ethers.Contract;
  daiAllowance: BigNumber;
  wethAllowance: BigNumber;
  registrarAddress: string;
  userDaiBalance: string;
  userWethBalance: string;
  directPayAddress: string;
  escrowAddress: string;
  signer: null | ethers.providers.JsonRpcSigner;
  explorer: string;
  chainId: string;
  graphUrl: string;
  nativeCurrenySymbol: string;
  walletBalance: string;
  userDaiBalanceRaw: BigNumber;
  userWethBalanceRaw: BigNumber;
  walletBalanceRaw: BigNumber;
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
  daiAllowance: BigNumber.from(0),
  wethAllowance: BigNumber.from(0),
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
  userDaiBalanceRaw: BigNumber.from(0),
  userWethBalanceRaw: BigNumber.from(0),
  walletBalanceRaw: BigNumber.from(0),
  disperse: null,
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

        const batchContract = batchContractMappingForChainId(chainId);

        const disperse = batchContract
          ? new ethers.Contract(batchContract, MultiDisperse.abi, signer)
          : null;

        if (contractMapping === undefined || deployedChainInfo == undefined) {
          setIsInitializing(false);
          setIsWrongChain(true);
          setBlockchainState({
            ...defaultBlockchainState,
            disperse,
            account,
            chainId: chainNumberToChainHex(chainId),
            signer,
          });
        } else {
          // Load contracts
          const firstBlockExplorer = deployedChainInfo.blockExplorerUrls[0];

          const weth = new ethers.Contract(
            contractMapping.weth,
            erc20.abi,
            signer
          );
          const dai = new ethers.Contract(
            contractMapping.dai,
            erc20.abi,
            signer
          );

          const walletBalance = await provider.getBalance(account);

          const userDaiBalance = await dai.balanceOf(account); // User's Dai balance
          const daiAllowance = await dai.allowance(
            account,
            contractMapping.registrar
          );

          const userWethBalance = await weth.balanceOf(account); // User's Weth balance
          const wethAllowance = await weth.allowance(
            account,
            contractMapping.registrar
          );

          setBlockchainState({
            signer,
            account,
            dai,
            weth,
            daiAllowance,
            wethAllowance,
            registrarAddress: contractMapping.registrar,
            userDaiBalance: ethers.utils.formatUnits(userDaiBalance),
            userWethBalance: ethers.utils.formatUnits(userWethBalance),
            explorer: firstBlockExplorer,
            directPayAddress: contractMapping.directPay,
            chainId: chainNumberToChainHex(chainId),
            graphUrl: deployedChainInfo.graphUrl, // Change from graphUrlto graphTestUrl for testing a local graph node
            escrowAddress: contractMapping.escrow, // TODO: deploy escrow
            nativeCurrenySymbol: deployedChainInfo.nativeCurrency?.symbol ?? "",
            walletBalance: ethers.utils.formatUnits(walletBalance),
            userDaiBalanceRaw: userDaiBalance,
            userWethBalanceRaw: userWethBalance,
            walletBalanceRaw: walletBalance,
            disperse,
          });
          setIsInitializing(false);
        }
      } catch (e) {
        console.log("error", e);
        window.alert("Error loading contracts");
        setIsInitializing(false);
      }
    }, [connectWalletWeb3Modal]);

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
