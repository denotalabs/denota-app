import { contractMappingForChainId } from "@denota-labs/denota-sdk";
import { DEFAULT_CHAIN_ID } from "../../context/config/chains";
import { balanceOfConditionalCashHookAddress } from "../balanceOfConditionalCash";
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
  const balanceOfConditionalCash =
    balanceOfConditionalCashHookAddress(chainId)?.toLowerCase();

  const registry: Record<string, HookRegistryEntry> = {
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

  if (balanceOfConditionalCash) {
    registry[balanceOfConditionalCash] = {
      name: "NFT Balance Condition",
      overrides: {
        cash: {
          label: "Release escrow",
          roles: ["owner", "payer"],
          branch: true,
          branches: [
            {
              key: "owner",
              label: "Claim to owner",
              to: (ctx: NotaActionContext) => ctx.owner,
              tone: "go",
            },
            {
              key: "payer",
              label: "Recover to sender",
              to: (ctx: NotaActionContext) => ctx.sender ?? "",
              tone: "back",
            },
          ],
          note: "Owner can claim when their NFT balance meets the condition. After expiration, the sender can recover funds.",
          fields: [],
          isAvailable: (ctx) => {
            const status = ctx.moduleData.status;
            return (
              !ctx.escrowWei.isZero() &&
              (status === "claimable" || status === "returnable")
            );
          },
        },
        fund: {
          roles: ["payer"],
          isAvailable: (ctx) => {
            if (ctx.escrowWei.isZero()) {
              return false;
            }
            const expirationDate =
              "expirationDate" in ctx.moduleData &&
              ctx.moduleData.expirationDate instanceof Date
                ? ctx.moduleData.expirationDate
                : null;
            const notExpired =
              expirationDate === null ||
              expirationDate.getTime() >= Date.now();
            return notExpired && ctx.moduleData.status !== "claimed";
          },
        },
      },
    };
  }

  return registry;
}

export const HOOK_REGISTRY = buildHookRegistry(DEFAULT_CHAIN_ID);

export function hookDisplayName(hookAddress: string): string | null {
  return HOOK_REGISTRY[hookAddress.toLowerCase()]?.name ?? null;
}
