import { useEffect, useState } from "react";
import { getChainConfig, POLYGON_CHAIN_ID } from "../context/config/chains";
import {
  metadataWithoutStateAttributes,
  parseTokenMetadata,
  TokenMetadata,
} from "../utils/notaTokenUri";
import { fetchNotaTokenUri } from "./notaRegistrarRead";

const GRAPH_QUERY_TIMEOUT_MS = 8_000;

const NOTAS_CASH_QUERY = `
  query notasCashFlags($ids: [ID!]!) {
    notas(where: { id_in: $ids }) {
      id
      cashes { id }
    }
  }
`;

export interface NotaStatusExtras {
  metadata: TokenMetadata | null;
  wasCashed: boolean;
  hasInteractionHistory: boolean;
}

const isAbortError = (error: unknown): boolean =>
  (error instanceof DOMException && error.name === "AbortError") ||
  (error instanceof Error && error.name === "AbortError");

async function fetchCashFlags(
  ids: string[],
  signal?: AbortSignal
): Promise<Map<string, boolean> | null> {
  const graphUrl = getChainConfig(POLYGON_CHAIN_ID)?.graphUrl;
  if (!graphUrl || ids.length === 0) {
    return null;
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      return null;
    }
    signal.addEventListener("abort", onAbort);
  }
  const timer = setTimeout(() => controller.abort(), GRAPH_QUERY_TIMEOUT_MS);
  try {
    const response = await fetch(graphUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: NOTAS_CASH_QUERY,
        variables: { ids },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    const json = (await response.json()) as {
      data?: { notas?: Array<{ id: string; cashes?: unknown[] }> };
    };
    const flags = new Map<string, boolean>();
    for (const nota of json.data?.notas ?? []) {
      flags.set(String(nota.id), (nota.cashes?.length ?? 0) > 0);
    }
    return flags;
  } catch (error) {
    if (!isAbortError(error)) {
      console.warn("Failed to load dashboard cash history", error);
    }
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function fetchNotaMetadataById(
  ids: string[]
): Promise<Map<string, TokenMetadata | null>> {
  const metadataById = new Map<string, TokenMetadata | null>();
  if (ids.length === 0) {
    return metadataById;
  }

  const tokenUris = await Promise.allSettled(
    ids.map((id) => fetchNotaTokenUri(id))
  );
  ids.forEach((id, index) => {
    const result = tokenUris[index];
    if (result.status !== "fulfilled") {
      metadataById.set(id, null);
      return;
    }
    const parsed = parseTokenMetadata(String(result.value));
    metadataById.set(
      id,
      parsed ? metadataWithoutStateAttributes(parsed) : null
    );
  });
  return metadataById;
}

/** TokenURI + subgraph cash flags — the same inputs the nota detail page uses. */
export async function fetchNotaStatusExtras(
  ids: string[],
  signal?: AbortSignal
): Promise<Map<string, NotaStatusExtras>> {
  const extras = new Map<string, NotaStatusExtras>();
  if (ids.length === 0) {
    return extras;
  }

  const [metadataById, cashFlags] = await Promise.all([
    fetchNotaMetadataById(ids),
    fetchCashFlags(ids, signal),
  ]);

  if (signal?.aborted) {
    return extras;
  }

  ids.forEach((id) => {
    extras.set(id, {
      metadata: metadataById.get(id) ?? null,
      wasCashed: cashFlags?.get(id) === true,
      hasInteractionHistory: cashFlags?.has(id) ?? false,
    });
  });
  return extras;
}

export function useNotaStatusExtras(ids: string[]) {
  const [extras, setExtras] = useState<Map<string, NotaStatusExtras>>(
    () => new Map()
  );
  const idsKey = ids.join(",");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    const nextIds = idsKey.split(",").filter(Boolean);
    if (nextIds.length === 0) {
      setExtras(new Map());
      setLoadedKey("");
      return;
    }

    const controller = new AbortController();
    fetchNotaStatusExtras(nextIds, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) {
          return;
        }
        setExtras(next);
        setLoadedKey(idsKey);
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Failed to load dashboard status extras", error);
        setExtras(new Map());
        setLoadedKey(idsKey);
      });

    return () => {
      controller.abort();
    };
  }, [idsKey]);

  return {
    extras,
    isLoaded: loadedKey === idsKey,
  };
}
