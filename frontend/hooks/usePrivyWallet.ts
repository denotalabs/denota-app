import { useEffect, useState } from "react";
import { classifyAccountInput } from "../utils/accountIdentity";
import { lookupPrivyWallet } from "../utils/privyClient";

export function usePrivyWallet(value: string | undefined): {
  address: string | null | undefined;
  isLoading: boolean;
  didFail: boolean;
} {
  const kind = value ? classifyAccountInput(value) : "empty";
  const query = kind === "email" || kind === "phone" ? value?.trim() : undefined;

  const [address, setAddress] = useState<string | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [didFail, setDidFail] = useState(false);

  useEffect(() => {
    if (!query) {
      setAddress(undefined);
      setIsLoading(false);
      setDidFail(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setAddress(undefined);
    setDidFail(false);

    const timeout = window.setTimeout(() => {
      lookupPrivyWallet(query)
        .then((resolved) => {
          if (cancelled) {
            return;
          }
          setAddress(resolved);
          setDidFail(false);
          setIsLoading(false);
        })
        .catch(() => {
          if (cancelled) {
            return;
          }
          setAddress(undefined);
          setDidFail(true);
          setIsLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  return { address, isLoading, didFail };
}
