import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import dCheque from '../../abis/dCheque.json';

type BlockchainData = {
  account: string;
  dcheque: null | ethers.Contract;
  dChequeAddress: string;
  dChequeBalance: string;
  userBalance: string;
  signer: null | ethers.providers.JsonRpcSigner;
};

const useBlockchainData = () => {
  const [state, setState] = useState<BlockchainData>({
    account: '',
    dcheque: null,
    dChequeAddress: '',
    dChequeBalance: '',
    userBalance: '',
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

  const loadBlockchainData = useCallback(async () => {
    if (typeof (window as any).ethereum !== 'undefined') {
      const [provider, signer, account, netId] = await connectWallet(); //console.log(provider, signer, account, netId)

      try {
        // Load contracts
        const dChequeAddress: string = await dCheque.networks[netId].address;
        const dcheque = new ethers.Contract(
          dChequeAddress,
          dCheque.abi,
          signer
        );
        (window as any).dCheque = dcheque;
        const dChequeBalance = await provider.getBalance(dChequeAddress);
        const userBalance = await dcheque.deposits(account);
        setState({
          signer: signer,
          account: account,
          dcheque: dcheque,
          dChequeAddress: dChequeAddress,
          dChequeBalance: ethers.utils.formatEther(dChequeBalance),
          userBalance: ethers.utils.formatEther(userBalance),
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
