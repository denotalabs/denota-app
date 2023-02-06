import { useEffect, useState } from "react";

import { ethers } from "ethers";

import { useColorMode } from "@chakra-ui/react";

import Web3Modal from "web3modal";

import { providerOptions } from "./providerOptions";

interface Web3Data {
  provider: ethers.providers.Web3Provider | undefined;
  signer: ethers.providers.JsonRpcSigner | undefined;
  address: string | undefined;
}

const useWeb3Modal = (): Web3Data => {
  const { colorMode } = useColorMode();
  const [web3Data, setWeb3Data] = useState<Web3Data>({
    provider: undefined,
    signer: undefined,
    address: undefined,
  });

  useEffect(() => {
    const initializeWeb3 = async () => {
      const web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions,
        theme: colorMode,
      });
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      if (signer) {
        const address = await signer.getAddress();
        setWeb3Data({ provider, signer, address });
      }
    };
    initializeWeb3();
  }, [colorMode]);

  return web3Data;
};

export default useWeb3Modal;
