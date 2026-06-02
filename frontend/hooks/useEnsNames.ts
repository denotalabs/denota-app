import { isAddress } from "ethers/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { lookupEnsNames } from "../utils/ensClient";

function uniqueAddresses(addresses: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const address of addresses) {
    if (address && isAddress(address)) {
      seen.add(address.toLowerCase());
    }
  }
  return [...seen];
}

export function useEnsNames(
  addresses: (string | null | undefined)[]
): Map<string, string | null> {
  const addressKey = useMemo(
    () => uniqueAddresses(addresses).sort().join(","),
    [addresses]
  );

  const [ensNames, setEnsNames] = useState<Map<string, string | null>>(
    new Map()
  );

  useEffect(() => {
    const normalizedAddresses = addressKey ? addressKey.split(",") : [];
    if (normalizedAddresses.length === 0) {
      setEnsNames(new Map());
      return;
    }

    let cancelled = false;

    lookupEnsNames(normalizedAddresses).then((results) => {
      if (cancelled) {
        return;
      }
      setEnsNames(results);
    });

    return () => {
      cancelled = true;
    };
  }, [addressKey]);

  return ensNames;
}
