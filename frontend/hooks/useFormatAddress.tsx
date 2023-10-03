import { useCallback } from "react";

export const useFormatAddress = () => {
  const formatAddress = useCallback((adress: string) => {
    return adress.slice(0, 5) + "..." + adress.slice(-4);
  }, []);
  return { formatAddress };
};
