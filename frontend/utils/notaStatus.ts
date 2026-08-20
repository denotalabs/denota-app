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
}

/** Deadline after which the recipient can no longer claim, if the hook has one. */
function claimDeadline(
  module: HookModuleName | null,
  metadata: TokenMetadata | null
): Date | null {
  switch (module) {
    case "cashBeforeDate":
    case "cashBeforeDateDrip":
    case "balanceOfConditionalCash":
      return getMetadataDateAttribute(metadata, TRAIT.expirationDate);
    default:
      return null;
  }
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
}: NotaStatusInput): NotaDisplayStatus {
  const module = hookAddress ? hookModuleName(hookAddress) : null;

  if (module === "directSend") {
    return { label: "Sent", tone: "settled" };
  }

  if (escrowHeld) {
    const deadline = claimDeadline(module, metadata);
    if (deadline && deadline.getTime() < Date.now()) {
      return { label: "Expired", tone: "expired" };
    }
    return { label: "Awaiting release", tone: "pending" };
  }

  if (interactions.some((interaction) => interaction.action === "Cashed")) {
    return { label: "Completed", tone: "settled" };
  }
  if (hasInteractionHistory) {
    return { label: "Not funded", tone: "pending" };
  }
  return { label: "Escrow empty", tone: "pending" };
}
