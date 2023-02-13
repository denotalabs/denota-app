import { useColorMode } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Web3Modal from "web3modal";
import CheqRegistrar from "../out/CheqRegistrar.sol/CheqRegistrar.json";
import erc20 from "../out/ERC20.sol/TestERC20.json";
import SelfSignedBroker from "../out/SelfSignTimeLock.sol/SelfSignTimeLock.json";
import { mappingForChainId } from "./chainInfo";
import { providerOptions } from "./providerOptions";

// TODO: Use cheq subdomain
export const APIURL_REMOTE = "https://klymr.me/api";

export const APIURL_LOCAL =
  "http://localhost:8000/subgraphs/name/CheqRegistrar/CheqRegistrar";

export const APIURL_HOSTED =
  "https://api.thegraph.com/subgraphs/name/soolaymahn/cheq-test";

export const APIURL = APIURL_REMOTE;

interface BlockchainDataInterface {
  account: string;
  dai: null | ethers.Contract;
  weth: null | ethers.Contract;
  selfSignBroker: null | ethers.Contract;
  daiAllowance: BigNumber;
  wethAllowance: BigNumber;
  cheqAddress: string;
  userDaiBalance: string;
  userWethBalance: string;

  signer: null | ethers.providers.JsonRpcSigner;
  explorer: string;
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

        const mapping = mappingForChainId(chainId);

        if (mapping === undefined) {
          setIsInitializing(false);
          setIsWrongChain(true);
          console.log("here");
        } else {
          // Load contracts
          const cheq = new ethers.Contract(
            mapping.cheq,
            CheqRegistrar.abi,
            signer
          );
          const selfSignBroker = new ethers.Contract(
            mapping.selfSignedBroker,
            SelfSignedBroker.abi,
            signer
          );
          const weth = new ethers.Contract(mapping.weth, erc20.abi, signer);
          const dai = new ethers.Contract(mapping.dai, erc20.abi, signer);

          const userDaiBalance = await dai.balanceOf(account); // User's Dai balance
          const daiAllowance = await dai.allowance(account, mapping.cheq);

          const userWethBalance = await weth.balanceOf(account); // User's Weth balance
          const wethAllowance = await weth.allowance(account, mapping.cheq);

          setBlockchainState({
            signer,
            account,
            dai,
            weth,
            selfSignBroker,
            daiAllowance,
            wethAllowance,
            cheqAddress: mapping.crx,
            userDaiBalance: ethers.utils.formatUnits(userDaiBalance),
            userWethBalance: ethers.utils.formatUnits(userWethBalance),
            explorer: mapping.explorer,
          });
          setIsInitializing(false);
        }
      } catch (e) {
        console.log("error", e);
        window.alert("Contracts not deployed to the current network");
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
