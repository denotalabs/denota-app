import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { useColorMode } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import Web3Modal from "web3modal";

import CheqRegistrar from "../out/CheqRegistrar.sol/CheqRegistrar.json";
import erc20 from "../out/ERC20.sol/TestERC20.json";
import {
  ChainInfo,
  chainInfoForChainId,
  chainNumberToChainHex,
  contractMappingForChainId,
} from "./chainInfo";
import { providerOptions } from "./providerOptions";

// TODO: Use cheq subdomain
export const APIURL_REMOTE = "https://klymr.me/graph-mumbai";

export const APIURL_TESTING =
  "http://ec2-18-204-63-18.compute-1.amazonaws.com/subgraphs/name/CheqRegistrar/CheqRegistrar";

export const APIURL_LOCAL =
  "http://localhost:8000/subgraphs/name/CheqRegistrar/CheqRegistrar";

export const APIURL_HOSTED =
  "https://api.thegraph.com/subgraphs/name/soolaymahn/cheq-test";

export const APIURL = APIURL_REMOTE;

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
  signer: null | ethers.providers.JsonRpcSigner;
  explorer: string;
  chainId: string;
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
  selfSignBroker: null,
  daiAllowance: BigNumber.from(0),
  wethAllowance: BigNumber.from(0),
  cheqAddress: "",
  qDAI: "",
  qWETH: "",
  userDaiBalance: "",
  userWethBalance: "",
  cheqTotalSupply: "",
  signer: null,
  explorer: "",
  directPayAddress: "",
  chainId: "",
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
      const web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions, // required
        theme: colorMode,
      });
      const web3ModalConnection = await web3Modal.connect();
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

        window.ethereum.on("chainChanged", () => {
          document.location.reload();
        });

        window.ethereum.on("accountsChanged", () => {
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
            contractMapping.cheq,
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

          const userDaiBalance = await dai.balanceOf(account); // User's Dai balance
          const daiAllowance = await dai.allowance(
            account,
            contractMapping.cheq
          );

          const userWethBalance = await weth.balanceOf(account); // User's Weth balance
          const wethAllowance = await weth.allowance(
            account,
            contractMapping.cheq
          );

          setBlockchainState({
            signer,
            account,
            dai,
            weth,
            daiAllowance,
            wethAllowance,
            cheqAddress: contractMapping.cheq,
            userDaiBalance: ethers.utils.formatUnits(userDaiBalance),
            userWethBalance: ethers.utils.formatUnits(userWethBalance),
            explorer: firstBlockExplorer,
            cheq,
            directPayAddress: contractMapping.directPayModule,
            chainId: chainNumberToChainHex(chainId),
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
      const web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions, // required
      });
      if (web3Modal.cachedProvider) {
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
