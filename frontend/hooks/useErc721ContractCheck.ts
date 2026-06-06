import { ethers } from "ethers";
import { useEffect, useState } from "react";

import { DEFAULT_CHAIN_ID } from "../context/config/chains";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { getErc721ContractInfo } from "../utils/erc721";

export function useErc721ContractCheck(address: string | undefined): {
  isErc721: boolean | null;
  contractName: string | null;
  isLoading: boolean;
} {
  const { blockchainState } = useBlockchainData();
  const chainId = blockchainState.chainIdNumber || DEFAULT_CHAIN_ID;

  const [isErc721, setIsErc721] = useState<boolean | null>(null);
  const [contractName, setContractName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !ethers.utils.isAddress(address)) {
      setIsErc721(null);
      setContractName(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setIsErc721(null);
    setContractName(null);

    const timer = window.setTimeout(() => {
      getErc721ContractInfo(address, chainId)
        .then(({ isErc721: supported, name }) => {
          if (cancelled) {
            return;
          }
          setIsErc721(supported);
          setContractName(name);
          setIsLoading(false);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setIsErc721(false);
          setContractName(null);
          setIsLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [address, chainId]);

  return { isErc721, contractName, isLoading };
}
