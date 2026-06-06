import { ACTION_DEFS } from "./actionDefs";
import { HOOK_REGISTRY } from "./hookRegistry";
import { ActionId, NotaActionContext, NotaRole, ResolvedAction } from "./types";

const PHASE_ONE_ACTIONS: ActionId[] = ["transfer", "fund", "cash"];

const ACTION_ORDER: ActionId[] = [
  "transfer",
  "fund",
  "cash",
  "update",
  "burn",
];

export function resolveActions(
  role: NotaRole,
  ctx: NotaActionContext
): ResolvedAction[] {
  const reg = HOOK_REGISTRY[(ctx.hook || "").toLowerCase()];

  return ACTION_ORDER.map((id) => {
    const base = ACTION_DEFS[id];
    const ov = reg?.overrides?.[id];
    const merged: ResolvedAction = ov ? { ...base, ...ov } : { ...base };
    return merged;
  })
    .filter((action) => PHASE_ONE_ACTIONS.includes(action.id))
    .filter((action) => action.roles.includes(role))
    .filter((action) => {
      if (!action.isAvailable) {
        return true;
      }
      return action.isAvailable(ctx);
    });
}
