import { useCallback } from "react";
import { ethers } from "ethers";

const useENSResolver = (projectId: string) => {
  const resolveENS = useCallback(async (name: string): Promise<string | null> => {
    const provider = new ethers.providers.JsonRpcProvider(
      `https://mainnet.infura.io/v3/${projectId}`
    );

    try {
      const resolver = await provider.getResolver(name);
      if (!resolver) return null;

      const address = await resolver.getAddress();
      return address === ethers.constants.AddressZero ? null : address;
    } catch (error) {
      console.error("Error resolving ENS name:", error);
      return null;
    }
  }, [projectId]);

  return { resolveENS };
};

export default useENSResolver;
