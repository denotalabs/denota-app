import { contractMappingForChainId } from "@denota-labs/denota-sdk";
import { DEFAULT_CHAIN_ID } from "../../context/config/chains";
import { balanceOfConditionalCashHookAddress } from "../balanceOfConditionalCash";
import { ActionDef, ActionId, NotaActionContext } from "./types";

/** Module keys shared with the SDK's `ModuleData.moduleName`. */
export type HookModuleName =
  | "directSend"
  | "simpleCash"
  | "cashBeforeDate"
  | "reversibleByBeforeDate"
  | "cashBeforeDateDrip"
  | "reversibleRelease"
  | "balanceOfConditionalCash";

export interface HookRegistryEntry {
  name: string;
  module: HookModuleName;
  overrides: Partial<Record<ActionId, Partial<ActionDef>>>;
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
    [mapping.directSend.toLowerCase()]: {
      name: "Direct Pay",
      module: "directSend",
      overrides: {},
    },
    [mapping.simpleCash.toLowerCase()]: {
      name: "Simple Cash",
      module: "simpleCash",
      overrides: {},
    },
    [mapping.cashBeforeDate.toLowerCase()]: {
      name: "Cash Before Date",
      module: "cashBeforeDate",
      overrides: {},
    },
    [mapping.reversibleByBeforeDate.toLowerCase()]: {
      name: "Reversible By Before Date",
      module: "reversibleByBeforeDate",
      overrides: {},
    },
    [mapping.cashBeforeDateDrip.toLowerCase()]: {
      name: "Cash Before Date Drip",
      module: "cashBeforeDateDrip",
      overrides: {
        cash: {
          label: "Claim drip",
          roles: ["owner", "approved"],
          branch: true,
          // The claim amount and destination are fixed by the hook, so this is
          // a single confirm rather than a form.
          branches: [
            {
              key: "owner",
              label: "Claim this period's drip",
              to: (ctx: NotaActionContext) => ctx.owner,
              tone: "go",
            },
          ],
          note: "Claims one drip period's amount to the owner. The next claim unlocks when the period rolls over.",
          fields: [],
          isAvailable: (ctx) =>
            !ctx.escrowWei.isZero() && ctx.moduleData.status === "claimable",
        },
      },
    },
    [reversibleRelease]: {
      name: "Reversible Release",
      module: "reversibleRelease",
      overrides: {
        cash: {
          label: "Release escrow",
          roles: ["owner", "approved", "inspector", "payer", "stranger"],
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
          isAvailable: (ctx) =>
            !ctx.escrowWei.isZero() &&
            !!ctx.inspector &&
            ctx.viewer === ctx.inspector,
        },
      },
    },
  };

  if (balanceOfConditionalCash) {
    registry[balanceOfConditionalCash] = {
      name: "NFT Balance Condition",
      module: "balanceOfConditionalCash",
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

const registryByChainId = new Map<number, Record<string, HookRegistryEntry>>();

/** Registry for a chain; built once per chain since the addresses are static. */
function hookRegistryForChain(
  chainId: number
): Record<string, HookRegistryEntry> {
  const cached = registryByChainId.get(chainId);
  if (cached) {
    return cached;
  }
  const registry = buildHookRegistry(chainId);
  registryByChainId.set(chainId, registry);
  return registry;
}

export function hookRegistryEntry(
  hookAddress: string,
  chainId: number = DEFAULT_CHAIN_ID
): HookRegistryEntry | null {
  return (
    hookRegistryForChain(chainId)[(hookAddress || "").toLowerCase()] ?? null
  );
}

export function hookDisplayName(
  hookAddress: string,
  chainId?: number
): string | null {
  return hookRegistryEntry(hookAddress, chainId)?.name ?? null;
}

export function hookModuleName(
  hookAddress: string,
  chainId?: number
): HookModuleName | null {
  return hookRegistryEntry(hookAddress, chainId)?.module ?? null;
}
