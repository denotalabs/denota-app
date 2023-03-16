import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";

const createProvider = async (url: any) => {
  const p = new ethers.providers.StaticJsonRpcProvider(url);

  await p.ready;

  return p;
};

export const useStaticJsonRPC = (urlArray: any) => {
  const [provider, setProvider] = useState(null);

  const handleProviders = useCallback(async () => {
    try {
      const p = await Promise.race(urlArray.map(createProvider));
      const _p = await p;

      setProvider(_p);
    } catch (error) {
      // todo: show notification error about provider issues
      // console.log(error);
    }
  }, [urlArray]);

  useEffect(() => {
    handleProviders();
    // eslint-disable-next-line
  }, [JSON.stringify(urlArray)]);

  return provider;
};
