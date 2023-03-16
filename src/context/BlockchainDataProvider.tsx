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

import CheqRegistrar from "../frontend-abi/CheqRegistrar.sol/CheqRegistrar.json";
import erc20 from "../frontend-abi/ERC20.sol/TestERC20.json";
import {
  ChainInfo,
  chainInfoForChainId,
  chainNumberToChainHex,
  contractMappingForChainId,
} from "./chainInfo";
import { providerOptions } from "./providerOptions";

interface BlockchainDataInterface {
  account: string;
  dai: null | ethers.Contract;
  weth: null | ethers.Contract;
  daiAllowance: BigNumber;
  wethAllowance: BigNumber;
  cheqAddress: string;
  userDaiBalance: string;
  userWethBalance: string;
  cheq: null | ethers.Contract;
  directPayAddress: string;
  escrowAddress: string;
  signer: null | ethers.providers.JsonRpcSigner;
  explorer: string;
  chainId: string;
  graphUrl: string;
  nativeCurrenySymbol: string;
  walletBalance: BigNumber;
  userDaiBalanceRaw: BigNumber;
  userWethBalanceRaw: BigNumber;
}

interface BlockchainDataContextInterface {
  blockchainState: BlockchainDataInterface;
  isInitializing: boolean;
  connectWallet?: () => Promise<void>;
  isWrongChain: boolean;
}

const defaultBlockchainState = {
  account: "",
  cheq: null,
  dai: null,
  weth: null,
  daiAllowance: BigNumber.from(0),
  wethAllowance: BigNumber.from(0),
  cheqAddress: "",
  userDaiBalance: "",
  userWethBalance: "",
  signer: null,
  explorer: "",
  directPayAddress: "",
  chainId: "",
  graphUrl: "",
  escrowAddress: "",
  nativeCurrenySymbol: "",
  walletBalance: BigNumber.from(0),
  userDaiBalanceRaw: BigNumber.from(0),
  userWethBalanceRaw: BigNumber.from(0),
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
          document.location.reload();
        });

        window.ethereum?.on("accountsChanged", () => {
          window.location.reload();
        });
        const contractMapping = contractMappingForChainId(chainId);
        const deployedChainInfo: ChainInfo = chainInfoForChainId(chainId);

        if (contractMapping === undefined || deployedChainInfo == undefined) {
          setIsInitializing(false);
          setIsWrongChain(true);
          setBlockchainState({
            ...defaultBlockchainState,
            account,
          });
        } else {
          // Load contracts
          const firstBlockExplorer = deployedChainInfo.blockExplorerUrls[0];
          const cheq = new ethers.Contract(
            contractMapping.registrar,
            CheqRegistrar.abi,
            signer
          );

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
            cheqAddress: contractMapping.registrar,
            userDaiBalance: ethers.utils.formatUnits(userDaiBalance),
            userWethBalance: ethers.utils.formatUnits(userWethBalance),
            explorer: firstBlockExplorer,
            cheq,
            directPayAddress: contractMapping.directPay,
            chainId: chainNumberToChainHex(chainId),
            graphUrl: deployedChainInfo.graphUrl,
            escrowAddress: contractMapping.directPay, // TODO: deploy escrow
            nativeCurrenySymbol: deployedChainInfo.nativeCurrency?.symbol ?? "",
            walletBalance,
            userDaiBalanceRaw: userDaiBalance,
            userWethBalanceRaw: userWethBalance,
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
