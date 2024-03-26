import { providers } from "ethers";
import { useMemo } from "react";
import { useConnectorClient } from "wagmi";

import { useAccount } from "wagmi";

function clientToSigner(
  client: any,
  accountAddress: string
): [providers.Web3Provider, providers.JsonRpcSigner, string] {
  const { chain, transport } = client;

  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new providers.Web3Provider(transport, network);
  const signer = provider.getSigner(accountAddress);
  return [provider, signer, accountAddress];
}

export function useEthersSigner() {
  const { data: client } = useConnectorClient();
  const { address } = useAccount();
  return useMemo(() => {
    return client && address
      ? clientToSigner(client as any, address)
      : undefined;
  }, [client, address]);
}
