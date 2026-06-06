import { contractMappingForChainId } from "@denota-labs/denota-sdk";
import { DEFAULT_CHAIN_ID } from "../../context/config/chains";
import { ActionDef, NotaActionContext } from "./types";

export interface HookRegistryEntry {
  name: string;
  overrides: Partial<Record<string, Partial<ActionDef>>>;
}

function buildHookRegistry(chainId: number): Record<string, HookRegistryEntry> {
  const mapping = contractMappingForChainId(chainId);
  if (!mapping) {
    return {};
  }

  const reversibleRelease = mapping.reversibleRelease.toLowerCase();

  return {
    [reversibleRelease]: {
      name: "Reversible Release",
      overrides: {
        cash: {
          label: "Release escrow",
          roles: ["inspector"],
          branch: true,
          branches: [
            {
              key: "owner",
              label: "Release to owner",
              to: (ctx: NotaActionContext) => ctx.owner,
              tone: "go",
            },
            {
              key: "payer",
              label: "Refund to payer",
              to: (ctx: NotaActionContext) => ctx.sender ?? "",
              tone: "back",
            },
          ],
          note: "As inspector, release the full escrow to the owner or refund it to the payer.",
          fields: [],
          isAvailable: (ctx) => {
            const status = ctx.moduleData.status;
            return (
              !ctx.escrowWei.isZero() &&
              (status === "releasable" || status === "returnable")
            );
          },
        },
      },
    },
  };
}

export const HOOK_REGISTRY = buildHookRegistry(DEFAULT_CHAIN_ID);

export function hookDisplayName(hookAddress: string): string | null {
  return HOOK_REGISTRY[hookAddress.toLowerCase()]?.name ?? null;
}
