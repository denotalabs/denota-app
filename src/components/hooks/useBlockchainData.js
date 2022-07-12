import { useCallback, useState } from 'react';
import { ethers } from 'ethers';
import dCheque from '../../abis/dCheque.json';

const useBlockchainData = () => {
  const [state, setState] = useState({
    web3: 'undefined',
    account: '',
    dcheque: null,
    dChequeAddress: null,
    dChequeBalance: 0,
    userBalance: 0,
  });

  const connectWallet = useCallback(async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum); // console.log(provider) //, window.ethereum, 5777 'http://localhost:8545'
    await provider.send('eth_requestAccounts', []);
    provider.on('network', (newNetwork, oldNetwork) => {
      if (oldNetwork) {
        window.location.reload();
      }
    }); // Reload on network change
    const signer = provider.getSigner(); //console.log(provider)
    let account = await signer.getAddress(); //console.log(account)
    let netId = 5777;
    return [provider, signer, account, netId];
  }, []);

  const loadBlockchainData = useCallback(async () => {
    if (typeof window.ethereum !== 'undefined') {
      let [provider, signer, account, netId] = await connectWallet(); //console.log(provider, signer, account, netId)

      try {
        // Load contracts
        const dChequeAddress = await dCheque.networks[netId].address;
        let dcheque = new ethers.Contract(dChequeAddress, dCheque.abi, signer);
        window.dCheque = dcheque;
        const dChequeBalance = await provider.getBalance(dChequeAddress);
        let userBalance = await dcheque.deposits(account);
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
