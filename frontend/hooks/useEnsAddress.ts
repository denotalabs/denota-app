import { useEffect, useState } from "react";
import { isEnsName, normalizeEnsName } from "../utils/ensAddress";
import { lookupEnsAddress } from "../utils/ensClient";

export function useEnsAddress(name: string | undefined): {
  address: string | null | undefined;
  isLoading: boolean;
} {
  const normalizedName =
    name && isEnsName(name) ? normalizeEnsName(name) : undefined;

  const [address, setAddress] = useState<string | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!normalizedName) {
      setAddress(undefined);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setAddress(undefined);

    const timeout = window.setTimeout(() => {
      lookupEnsAddress(normalizedName)
        .then((resolved) => {
          if (cancelled) {
            return;
          }
          setAddress(resolved);
          setIsLoading(false);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setAddress(null);
          setIsLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [normalizedName]);

  return { address, isLoading };
}
