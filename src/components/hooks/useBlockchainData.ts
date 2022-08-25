import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import dCheque from '../../abis/dCheque.json';

type BlockchainData = {
  account: string;
  dcheque: null | ethers.Contract;
  dChequeAddress: string;
  dChequeBalance: string;
  userBalance: string;
  userChequeCount: number;
  dChequeTotalSupply: string;
  userCheques: Array<any>;
  acceptedUserAuditors:Array<any>;
  acceptedAuditorUsers:Array<any>;
  
  signer: null | ethers.providers.JsonRpcSigner;
};

const useBlockchainData = () => {
  const [state, setState] = useState<BlockchainData>({
    account: '',
    dcheque: null,
    dChequeAddress: '',
    dChequeBalance: '',
    userBalance: '',
    userChequeCount: 0,
    dChequeTotalSupply: '',
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

      try {
        // Load contracts
        const dChequeAddress: string = await dCheque.networks['5777'].address;
        const dcheque = new ethers.Contract(
          dChequeAddress,
          dCheque.abi,
          signer
        );
        (window as any).dCheque = dcheque;
        const dChequeBalance = await provider.getBalance(dChequeAddress);
        const userBalance = await dcheque.deposits(account);
        const userChequeCount = (await dcheque.chequeCount(account)).toNumber();
        const userCheques = await getUserCheques(dcheque, account, userChequeCount);
        const acceptedUserAuditors = await dcheque.getAcceptedUserAuditors(account);
        const acceptedAuditorUsers = await dcheque.getAcceptedAuditorUsers(account);
        const dChequeTotalSupply = await dcheque.totalSupply;
        setState({
          signer: signer,
          account: account,
          dcheque: dcheque,
          dChequeAddress: dChequeAddress,
          dChequeBalance: ethers.utils.formatEther(dChequeBalance),
          userBalance: ethers.utils.formatEther(userBalance),
          userChequeCount: userChequeCount,
          dChequeTotalSupply: String(dChequeTotalSupply),
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
