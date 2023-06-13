import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useColorMode } from "@chakra-ui/react";
import { SafeAppWeb3Modal } from "@safe-global/safe-apps-web3modal";
import { BigNumber, ethers } from "ethers";

import {
  contractMappingForChainId,
  setProvider,
} from "@denota-labs/denota-sdk";
// TODO: remove references to cheq from contracts
import erc20 from "../frontend-abi/ERC20.sol/TestERC20.json";
import MultiDisperse from "../frontend-abi/MultiDisperse.sol/MultiDisperse.json";
import {
  ChainInfo,
  chainInfoForChainId,
  chainNumberToChainHex,
} from "./chainInfo";
import { providerOptions } from "./providerOptions";

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

    const { colorMode } = useColorMode();

    const connectWalletWeb3Modal = useCallback(async () => {
      const safeAppWeb3Modal = new SafeAppWeb3Modal({
        cacheProvider: true, // optional
        providerOptions, // required
        theme: colorMode,
      });
      const web3ModalConnection = await safeAppWeb3Modal.connect();
      try {
        await setProvider({
          type: "web3",
          web3Connection: web3ModalConnection,
        });
      } catch (error) {
        console.log(error);
      }
      const provider = new ethers.providers.Web3Provider(web3ModalConnection);
      const signer = provider.getSigner(); //console.log(provider)
      const account = await signer.getAddress(); //console.log(account)
      return [provider, signer, account] as [
        ethers.providers.Web3Provider,
        ethers.providers.JsonRpcSigner,
        string
      ];
    }, [colorMode]);

    const loadBlockchainData = useCallback(async () => {
      setIsInitializing(true);
      try {
        const [provider, signer, account] = await connectWalletWeb3Modal(); // console.log(provider, signer, account)
        const { chainId } = await provider.getNetwork();

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

          // TODO: handle on different contract on different chains
          const disperse = new ethers.Contract(
            "0xa58AA04c66aF0e8A5B22e17a48EEA34405c526b5",
            MultiDisperse.abi,
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
      const safeAppWeb3Modal = new SafeAppWeb3Modal({
        cacheProvider: true, // optional
        providerOptions, // required
      });
      if (safeAppWeb3Modal.cachedProvider) {
        loadBlockchainData();
      } else {
        setIsInitializing(false);
      }
    }, [loadBlockchainData]);

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
