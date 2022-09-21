import { useCallback, useState } from "react";
import { BigNumber, ethers } from "ethers";

import Cheq from "../out/Cheq.sol/Cheq.json";
import CheqAddress from "../out/Cheq.sol/CheqAddress.json";
import erc20 from "../out/ERC20.sol/TestERC20.json";
import DaiAddress from "../out/ERC20.sol/DaiAddress.json";
import WethAddress from "../out/ERC20.sol/WethAddress.json";

export type BlockchainData = {
  account: string;
  userType: string;
  cheq: null | ethers.Contract;
  dai: null | ethers.Contract;
  weth: null | ethers.Contract;
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
  userChequeCount: string;
  cheqTotalSupply: string;
  userCheques: Array<any>;
  acceptedUserAuditors: Array<any>;
  acceptedAuditorUsers: Array<any>;

  signer: null | ethers.providers.JsonRpcSigner;
};

const useBlockchainData = () => {
  const [blockchainState, setBlockchainState] = useState<BlockchainData>({
    account: "",
    userType: "Customer",
    cheq: null,
    dai: null,
    weth: null,
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
    userChequeCount: "",
    cheqTotalSupply: "",
    userCheques: [],
    acceptedUserAuditors: [],
    acceptedAuditorUsers: [],
    signer: null,
  });

  const connectWallet = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    ); // console.log(provider) //, window.ethereum, 5777 'http://localhost:8545'
    await provider.send("eth_requestAccounts", []);
    provider.on("network", (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        window.location.reload();
      }
    }); // Reload on network change
    const signer = provider.getSigner(); //console.log(provider)
    const account = await signer.getAddress(); //console.log(account)
    const netId = "5777";
    return [provider, signer, account, netId] as [
      ethers.providers.Web3Provider,
      ethers.providers.JsonRpcSigner,
      string,
      string
    ];
  }, []);

  const getUserCheques = useCallback(
    async (
      cheqContract: ethers.Contract,
      account: string,
      userChequeCount: number
    ) => {
      const userCheques = [];
      let cheque, cheqOwner;
      for (let i = 0; userCheques.length < userChequeCount; i++) {
        cheqOwner = await cheqContract.ownerOf(i);
        cheque = await cheqContract.chequeInfo(i);
        console.log(cheqOwner, cheque);

        let timeCreated = cheque.created.toNumber();
        timeCreated = new Date(timeCreated * 1000); // console.log(timeCreated)

        if (cheqOwner == account) {
          userCheques.push([i, cheque, timeCreated]);
        } else if (cheque.drawer == account) {
          userCheques.push([i, cheque, timeCreated]);
        }
      }
      return userCheques;
    },
    []
  );

  const loadBlockchainData = useCallback(async () => {
    if (typeof (window as any).ethereum !== "undefined") {
      const [provider, signer, account, netid] = await connectWallet(); // console.log(provider, signer, account)
      let userType =
        account == "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
          ? "Customer"
          : account == "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
          ? "Merchant"
          : "Auditor";
      try {
        console.log(userType, account);
        // Load contracts
        const cheqAddress: string =
          "0xE853832b71a36C5cEF23ea6C9ADDEb5f94211364"; //CheqAddress["deployedTo"];
        const cheq = new ethers.Contract(cheqAddress, Cheq.abi, signer);
        const weth = new ethers.Contract(
          "0x612f8B2878Fc8DFB6747bc635b8B3DeDFDaeb39e", //WethAddress["deployedTo"],
          erc20.abi,
          signer
        );
        const dai = new ethers.Contract(
          "0x982723cb1272271b5ee405A5F14E9556032d9308", //DaiAddress["deployedTo"],
          erc20.abi,
          signer
        );

        const daiBalance = await dai.balanceOf(cheqAddress); // Cheq's Dai balance
        const userDaiBalance = await dai.balanceOf(account); // User's Dai balance
        const qDAI = await cheq.deposits(dai.address, account); // User's deposited dai balance
        const daiAllowance = await dai.allowance(account, cheqAddress);
        console.log("dai allowance: ", daiAllowance.toString());

        const wethBalance = await weth.balanceOf(cheqAddress); // Cheq's Weth balance
        const userWethBalance = await weth.balanceOf(account); // User's Weth balance
        const qWETH = await cheq.deposits(weth.address, account); // User's deposited Weth balance
        const wethAllowance = await weth.allowance(account, cheqAddress);
        console.log("weth allowance: ", wethAllowance.toString());

        (window as any).Cheq = cheq;
        const cheqBalance = await provider.getBalance(cheqAddress);
        const userChequeCount = (await cheq.balanceOf(account)).toNumber();
        const userCheques = await getUserCheques(
          cheq,
          account,
          userChequeCount
        );
        const cheqTotalSupply = await cheq.totalSupply();

        setBlockchainState({
          signer: signer,
          account: account,
          userType: userType,
          cheq: cheq,
          dai: dai,
          weth: weth,
          daiAllowance: daiAllowance,
          wethAllowance: wethAllowance,
          cheqAddress: cheqAddress,
          cheqBalance: ethers.utils.formatEther(cheqBalance).slice(0, -2),
          qDAI: ethers.utils.formatUnits(qDAI),
          qWETH: ethers.utils.formatUnits(qWETH),
          userDaiBalance: ethers.utils.formatUnits(userDaiBalance),
          userWethBalance: ethers.utils.formatUnits(userWethBalance),
          daiBalance: ethers.utils.formatUnits(daiBalance),
          wethBalance: ethers.utils.formatUnits(wethBalance),
          userChequeCount: userChequeCount,
          cheqTotalSupply: String(cheqTotalSupply),
          userCheques: userCheques,
          acceptedUserAuditors: [], //acceptedUserAuditors,
          acceptedAuditorUsers: [], //acceptedAuditorUsers,
        });
        return true;
      } catch (e) {
        console.log("error", e);
        window.alert("Contracts not deployed to the current network");
      }
    } else {
      //if MetaMask not exists push alert
      window.alert("Please install MetaMask");
    }
  }, [connectWallet]);

  return { blockchainState, loadBlockchainData };
};

export default useBlockchainData;
