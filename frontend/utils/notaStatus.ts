import { HookModuleName, hookModuleName } from "./notaActions/hookRegistry";
import { TRAIT } from "./notaActions/metadataTraits";
import { NotaInteraction } from "./notaInteractions";
import { getMetadataDateAttribute, TokenMetadata } from "./notaTokenUri";

export type NotaStatusTone = "pending" | "settled" | "expired";

export interface NotaDisplayStatus {
  label: string;
  tone: NotaStatusTone;
}

export interface NotaStatusInput {
  hookAddress: string | null;
  metadata: TokenMetadata | null;
  /** True while the registrar still holds escrow for this nota. */
  escrowHeld: boolean;
  interactions: NotaInteraction[];
  /** Without subgraph history, an empty escrow is ambiguous. */
  hasInteractionHistory: boolean;
  /** Claim deadline when metadata is not loaded (e.g. dashboard rows). */
  expiration?: Date | null;
  /** True when a cash has already been recorded (e.g. subgraph `cashes`). */
  wasCashed?: boolean;
}

const DEADLINE_MODULES: ReadonlySet<HookModuleName> = new Set([
  "cashBeforeDate",
  "cashBeforeDateDrip",
  "balanceOfConditionalCash",
]);

/** Claim deadline from SDK module data when tokenURI metadata is not loaded. */
export function expirationFromModuleData(moduleData: {
  moduleName: string;
  cashBeforeDate?: Date | null;
  expirationDate?: Date | null;
}): Date | null {
  switch (moduleData.moduleName) {
    case "cashBeforeDate":
      return moduleData.cashBeforeDate ?? null;
    case "cashBeforeDateDrip":
    case "balanceOfConditionalCash":
      return moduleData.expirationDate ?? null;
    default:
      return null;
  }
}

/** Deadline after which the recipient can no longer claim, if the hook has one. */
function claimDeadline(
  module: HookModuleName | null,
  metadata: TokenMetadata | null,
  expiration?: Date | null
): Date | null {
  if (!module || !DEADLINE_MODULES.has(module)) {
    return null;
  }
  return expiration ?? getMetadataDateAttribute(metadata, TRAIT.expirationDate);
}

/**
 * True when dashboard status still needs tokenURI / subgraph extras. Subgraph
 * rows usually already have cash history and module dates; public RPC rows do
 * not.
 */
export function needsRemoteStatusExtras(input: {
  hookAddress: string | null;
  escrowHeld: boolean;
  expiration?: Date | null;
  hasInteractionHistory?: boolean;
}): boolean {
  const module = input.hookAddress ? hookModuleName(input.hookAddress) : null;
  if (module === "directSend") {
    return false;
  }
  if (input.escrowHeld) {
    return (
      module !== null &&
      DEADLINE_MODULES.has(module) &&
      input.expiration == null
    );
  }
  return input.hasInteractionHistory === undefined;
}

/**
 * Headline status for a nota, independent of who is looking at it. An empty
 * escrow means very different things per hook — direct sends never escrow, and
 * a claimed nota is settled rather than unfunded — so the balance alone is not
 * enough to label it.
 */
export function notaDisplayStatus({
  hookAddress,
  metadata,
  escrowHeld,
  interactions,
  hasInteractionHistory,
  expiration,
  wasCashed,
}: NotaStatusInput): NotaDisplayStatus {
  const module = hookAddress ? hookModuleName(hookAddress) : null;

  if (module === "directSend") {
    return { label: "Sent", tone: "settled" };
  }

  if (escrowHeld) {
    const deadline = claimDeadline(module, metadata, expiration);
    if (deadline && deadline.getTime() < Date.now()) {
      return { label: "Expired", tone: "expired" };
    }
    return { label: "Awaiting release", tone: "pending" };
  }

  if (
    wasCashed ||
    interactions.some((interaction) => interaction.action === "Cashed")
  ) {
    return { label: "Completed", tone: "settled" };
  }
  if (hasInteractionHistory) {
    return { label: "Not funded", tone: "pending" };
  }
  return { label: "Escrow empty", tone: "pending" };
}
