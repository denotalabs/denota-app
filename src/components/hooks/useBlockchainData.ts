import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import Cheq from '../../out/Cheq.sol/Cheq.json';

type BlockchainData = {
  account: string;
  cheq: null | ethers.Contract;
  cheqAddress: string;
  cheqBalance: string;
  userBalance: string;
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
    cheqAddress: '',
    cheqBalance: '',
    userBalance: '',
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
      if (cheque.bearer==account){  // Cheques In User's Possesion
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
      console.log(account);
      try {
        // Load contracts
        const cheqAddress: string = await Cheq.networks['5777'].address;
        const cheq = new ethers.Contract(
          cheqAddress,
          Cheq.abi,
          signer
        );
        (window as any).Cheq = cheq;
        const cheqBalance = await provider.getBalance(cheqAddress);
        // const userBalance = await cheq.deposits(account);  // TODO NEED BALANCE OF EACH TOKEN FORUSER
        const userChequeCount = (await cheq.balanceOf(account)).toNumber();
        const userCheques = await getUserCheques(cheq, account, userChequeCount);
        const acceptedUserAuditors = await cheq.getAcceptedUserAuditors(account);
        const acceptedAuditorUsers = await cheq.getAcceptedAuditorUsers(account);
        const cheqTotalSupply = await cheq.totalSupply;
        setState({
          signer: signer,
          account: account,
          cheq: cheq,
          cheqAddress: cheqAddress,
          cheqBalance: ethers.utils.formatEther(cheqBalance),
          userBalance: '0',//ethers.utils.formatEther(userBalance),
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
