import React, {
  createContext,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useContext } from "react";
import { BigNumber, ethers } from "ethers";
import Cheq from "../out/Cheq.sol/Cheq.json";
import SelfSignedBroker from "../out/CheqV2.sol/SelfSignTimeLock.json";
import erc20 from "../out/ERC20.sol/TestERC20.json";
import Web3Modal from "web3modal";
import { providerOptions } from "./providerOptions";

export const APIURL = "http://localhost:8000/subgraphs/name/Cheq/Cheq";

interface BlockchainDataInterface {
  account: string;
  userType: string;
  cheq: null | ethers.Contract;
  dai: null | ethers.Contract;
  weth: null | ethers.Contract;
  selfSignBroker: null | ethers.Contract;
  daiAllowance: BigNumber;
  wethAllowance: BigNumber;
  cheqAddress: string;
  cheqBalance: string;
  qDAI: string;
  qWETH: string;
  userDaiBalance: string;
  userWethBalance: string;
  daiBalance: string;
  wethBalance: string;
  cheqTotalSupply: string;

  signer: null | ethers.providers.JsonRpcSigner;
}

interface BlockchainDataContextInterface {
  blockchainState: BlockchainDataInterface;
  isInitializing: boolean;
  connectWallet?: () => Promise<void>;
}

export const CheqAddress = "0x5B631dD0d2984513C65A1b1538777FdF4E5f2B2A";
export const DaiAddress = "0x982723cb1272271b5ee405A5F14E9556032d9308";
export const WethAddress = "0x612f8B2878Fc8DFB6747bc635b8B3DeDFDaeb39e";

const AddressMapping = {
  mumbai: {
    crx: "0xA0A78F3Ba39E57047A35D6931eC3869962191e8c",
    cheq: "0x5B631dD0d2984513C65A1b1538777FdF4E5f2B2A",
    dai: "0x982723cb1272271b5ee405A5F14E9556032d9308",
    weth: "0xAA6DA55ba764428e1C4c492c6db5FDe3ccf57332",
    selfSignedBroker: "0x8Df6c6fb81d3d1DAAFCd5FD5564038b0d9006FbB",
  },
  local: {
    crx: "0x5B631dD0d2984513C65A1b1538777FdF4E5f2B2A",
    cheq: "0x5B631dD0d2984513C65A1b1538777FdF4E5f2B2A",
    dai: "0x982723cb1272271b5ee405A5F14E9556032d9308",
    weth: "0x612f8B2878Fc8DFB6747bc635b8B3DeDFDaeb39e",
    selfSignedBroker: "0x8Df6c6fb81d3d1DAAFCd5FD5564038b0d9006FbB",
  },
};

const mappingForChainId = (chainId: number) => {
  switch (chainId) {
    case 80001:
      return AddressMapping.mumbai;
    case 31337:
      return AddressMapping.local;
    default:
      return AddressMapping.mumbai;
  }
};

const defaultBlockchainState = {
  account: "",
  userType: "Customer",
  cheq: null,
  dai: null,
  weth: null,
  selfSignBroker: null,
  daiAllowance: BigNumber.from(0),
  wethAllowance: BigNumber.from(0),
  cheqAddress: "",
  cheqBalance: "0",
  qDAI: "",
  qWETH: "",
  userDaiBalance: "",
  userWethBalance: "",
  daiBalance: "",
  wethBalance: "",
  cheqTotalSupply: "",
  signer: null,
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

    const connectWalletWeb3Modal = useCallback(async () => {
      const web3Modal = new Web3Modal({
        cacheProvider: true, // optional
        providerOptions, // required
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
    }, []);

    const loadBlockchainData = useCallback(async () => {
      setIsInitializing(true);
      try {
        const [provider, signer, account] = await connectWalletWeb3Modal(); // console.log(provider, signer, account)
        const userType =
          account == "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            ? "Customer"
            : account == "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
            ? "Merchant"
            : "Auditor";
        const { chainId } = await provider.getNetwork();
        const mapping = mappingForChainId(chainId);

        // Load contracts
        const cheq = new ethers.Contract(mapping.cheq, Cheq.abi, signer);
        const selfSignBroker = new ethers.Contract(
          mapping.selfSignedBroker,
          SelfSignedBroker.abi,
          signer
        );
        const weth = new ethers.Contract(mapping.weth, erc20.abi, signer);
        const dai = new ethers.Contract(mapping.dai, erc20.abi, signer);

        const daiBalance = await dai.balanceOf(CheqAddress); // Cheq's Dai balance
        const userDaiBalance = await dai.balanceOf(account); // User's Dai balance
        const qDAI = await cheq.deposits(dai.address, account); // User's deposited dai balance
        const daiAllowance = await dai.allowance(account, CheqAddress);

        const wethBalance = await weth.balanceOf(CheqAddress); // Cheq's Weth balance
        const userWethBalance = await weth.balanceOf(account); // User's Weth balance
        const qWETH = await cheq.deposits(weth.address, account); // User's deposited Weth balance
        const wethAllowance = await weth.allowance(account, CheqAddress);

        const cheqBalance = await provider.getBalance(CheqAddress);
        const cheqTotalSupply = await cheq.totalSupply();

        setBlockchainState({
          signer,
          account,
          userType,
          cheq,
          dai,
          weth,
          selfSignBroker,
          daiAllowance,
          wethAllowance,
          cheqAddress: CheqAddress,
          cheqBalance: ethers.utils.formatEther(cheqBalance).slice(0, -2),
          qDAI: ethers.utils.formatUnits(qDAI),
          qWETH: ethers.utils.formatUnits(qWETH),
          userDaiBalance: ethers.utils.formatUnits(userDaiBalance),
          userWethBalance: ethers.utils.formatUnits(userWethBalance),
          daiBalance: ethers.utils.formatUnits(daiBalance),
          wethBalance: ethers.utils.formatUnits(wethBalance),
          cheqTotalSupply: String(cheqTotalSupply),
        });
        setIsInitializing(false);
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
    }, []);

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
