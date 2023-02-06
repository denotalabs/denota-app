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
import useWeb3Modal from "./useWeb3Modal";

// TODO: Use cheq subdomain
export const APIURL_REMOTE = "https://klymr.me/api";

export const APIURL_LOCAL =
  "http://localhost:8000/subgraphs/name/CheqRegistrar/CheqRegistrar";

export const APIURL_HOSTED =
  "https://api.thegraph.com/subgraphs/name/soolaymahn/cheq-test";

export const APIURL = APIURL_REMOTE;
export const CHAIN_NOT_FOUND = -1;
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
});

export const BlockchainDataProvider = memo(
  ({ children }: { children: React.ReactNode }) => {
    const [blockchainState, setBlockchainState] =
      useState<BlockchainDataInterface>(defaultBlockchainState);

    const [isInitializing, setIsInitializing] = useState(true);

    const web3Data = useWeb3Modal();
    const loadBlockchainData = useCallback(async () => {
      setIsInitializing(true);
      try {
        const { provider, signer, address } = web3Data; 
        const { chainId } = provider
          ? await provider.getNetwork()
          : { chainId: CHAIN_NOT_FOUND };

        window.ethereum.on("chainChanged", () => {
          document.location.reload();
        });

        window.ethereum.on("accountsChanged", () => {
          window.location.reload();
        });

        const mapping = mappingForChainId(chainId);

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

        const userDaiBalance = await dai.balanceOf(address); // User's Dai balance
        const daiAllowance = await dai.allowance(address, mapping.cheq);

        const userWethBalance = await weth.balanceOf(address); // User's Weth balance
        const wethAllowance = await weth.allowance(address, mapping.cheq);
        
        let signerValue: ethers.providers.JsonRpcSigner | null;
        if (signer) {
          signerValue = signer;
        } else {
          signerValue = null;
        }
        const addressValue = address || '';

        setBlockchainState({
          signer: signerValue,
          account: addressValue,
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
      } catch (e) {
        console.log("error", e);
        window.alert("Contracts not deployed to the current network");
        setIsInitializing(false);
      }
    }, [web3Data]);

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
