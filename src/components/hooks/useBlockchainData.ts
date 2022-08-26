import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import Cheq from '../../out/Cheq.sol/Cheq.json';
import CheqAddress from '../../out/Cheq.sol/CheqAddress.json';
import erc20 from '../../out/ERC20.sol/TestERC20.json';

type BlockchainData = {
  account: string;
  cheq: null | ethers.Contract;
  dai: null | ethers.Contract;
  weth: null | ethers.Contract;
  cheqAddress: string;
  cheqBalance: string;
  qDAI: string;
  qWETH: string;
  daiBalance: string;
  wethBalance: string;
  userChequeCount: number;
  cheqTotalSupply: string;
  userCheques: Array<any>;
  acceptedUserAuditors:Array<any>;
  acceptedAuditorUsers:Array<any>;
  
  signer: null | ethers.providers.JsonRpcSigner;
};

const useBlockchainData = () => {
  const [state, setState] = useState<BlockchainData>({
    account: '',
    cheq: null,
    dai: null,
    weth: null,
    cheqAddress: '',
    cheqBalance: '',
    qDAI: '',
    qWETH: '',
    daiBalance: '',
    wethBalance: '',
    userChequeCount: 0,
    cheqTotalSupply: '',
    userCheques: [],
    acceptedUserAuditors: [],
    acceptedAuditorUsers: [],
    signer: null,
  });

  const connectWallet = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(
      (window as any).ethereum
    ); // console.log(provider) //, window.ethereum, 5777 'http://localhost:8545'
    await provider.send('eth_requestAccounts', []);
    provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        window.location.reload();
      }
    }); // Reload on network change
    const signer = provider.getSigner(); //console.log(provider)
    const account = await signer.getAddress(); //console.log(account)
    const netId = '5777';
    return [provider, signer, account, netId] as [
      ethers.providers.Web3Provider,
      ethers.providers.JsonRpcSigner,
      string,
      string
    ];
  }, []);

  const getUserCheques = useCallback(async (dCheqContract: ethers.Contract, account: string, userChequeCount: number) => {
    const userCheques = [];
    let cheque, state, description;
    for (let i=1; userCheques.length<userChequeCount; i++){
      cheque = await dCheqContract.cheques(i)
      console.log(cheque.expiry.toNumber()>(Date.now()/1000))
      if (cheque.bearer==account) {  // Cheques In User's Possesion
        if (cheque.voided===true){  // Auditor Voided Cheque
          state = 'danger'
          description = 'Voided'
        } else if (cheque.expiry<=(Date.now()/1000)) {  // Cheque Ready to Cash
          state = 'success'
          description = 'Cashable'
        } else {  // Cheque Pending
          state = 'warning'
          description = 'Pending'
        }
        userCheques.push([i, cheque, state, description])
      } else if (cheque.drawer==account){  // User Sent this Cheque
        state = 'secondary'
        description = 'Sent'
        userCheques.push([i, cheque, state, description])
      }
    }
    return userCheques;
  }, []);

    
  const loadBlockchainData = useCallback(async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      const [provider, signer, account, ] = await connectWallet(); //console.log(provider, signer, account, netId)
      try {
        // Load contracts
        const cheqAddress: string = CheqAddress['deployedTo'];
        console.log(cheqAddress);
        const cheq = new ethers.Contract(
          cheqAddress,
          Cheq.abi,
          signer
        );
        const weth = new ethers.Contract(
          '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
          erc20.abi,
          signer
        );
        const dai = new ethers.Contract(
          '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
          erc20.abi,
          signer
        );

        const qDAI = ethers.utils.formatUnits((await dai.balanceOf(account)).toString()).toString();
        const qWETH =ethers.utils.formatUnits((await weth.balanceOf(account)).toString()).toString();
        (window as any).Cheq = cheq;
        const cheqBalance = await provider.getBalance(cheqAddress);
        const daiBalance = (await dai.balanceOf(cheqAddress)).toNumber().toString();
        const wethBalance = (await weth.balanceOf(cheqAddress)).toNumber().toString();
        const userChequeCount = (await cheq.balanceOf(account)).toNumber();
        const userCheques = await getUserCheques(cheq, account, userChequeCount);
        const acceptedUserAuditors = await cheq.getAcceptedUserAuditors(account);
        const acceptedAuditorUsers = await cheq.getAcceptedAuditorUsers(account);
        const cheqTotalSupply = await cheq.totalSupply;

        setState({
          signer: signer,
          account: account,
          cheq: cheq,
          dai: dai,
          weth: weth,
          cheqAddress: cheqAddress,
          cheqBalance: ethers.utils.formatEther(cheqBalance),
          qDAI: qDAI,
          qWETH: qWETH,
          daiBalance: daiBalance,
          wethBalance: wethBalance,
          userChequeCount: userChequeCount,
          cheqTotalSupply: String(cheqTotalSupply),
          userCheques: userCheques,
          acceptedUserAuditors: acceptedUserAuditors,
          acceptedAuditorUsers: acceptedAuditorUsers,
        });
        return true;
      } catch (e) {
        console.log('error', e);
        window.alert('Contracts not deployed to the current network');
      }
    } else {
      //if MetaMask not exists push alert
      window.alert('Please install MetaMask');
    }
  }, [connectWallet]);

  return { state, loadBlockchainData };
};

export default useBlockchainData;