import { ModuleData } from "@denota-labs/denota-sdk";
import { TokenMetadata } from "../notaTokenUri";
import { buildModuleDataFromTokenUri } from "./moduleDataFromTokenUri";
import { NotaActionContext, NotaRole } from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** Synthetic address that matches no on-chain role on this nota. */
export const STRANGER_PREVIEW_ADDRESS =
  "0x0000000000000000000000000000000000000001";

export const ROLE_LABELS: Record<NotaRole, string> = {
  owner: "Owner",
  approved: "Approved",
  inspector: "Inspector",
  payer: "Payer",
  stranger: "Stranger",
};

export function addressForPreviewRole(
  role: NotaRole,
  ctx: NotaActionContext
): string {
  switch (role) {
    case "owner":
      return ctx.owner;
    case "approved":
      return ctx.approved && ctx.approved !== ZERO_ADDRESS
        ? ctx.approved
        : STRANGER_PREVIEW_ADDRESS;
    case "inspector":
      return ctx.inspector ?? STRANGER_PREVIEW_ADDRESS;
    case "payer":
      return ctx.sender ?? STRANGER_PREVIEW_ADDRESS;
    case "stranger":
      return STRANGER_PREVIEW_ADDRESS;
  }
}

export function previewableRoles(ctx: NotaActionContext): NotaRole[] {
  const roles: NotaRole[] = ["owner", "stranger"];
  if (ctx.approved && ctx.approved !== ZERO_ADDRESS) {
    roles.splice(1, 0, "approved");
  }
  if (ctx.inspector) {
    roles.push("inspector");
  }
  if (ctx.sender) {
    roles.push("payer");
  }
  return roles;
}

const UNKNOWN_MODULE_DATA: ModuleData = {
  moduleName: "unknown",
  status: "?",
  writeBytes: "",
  externalURI: "",
  imageURI: "",
};

export function buildContextForRole(
  base: NotaActionContext,
  role: NotaRole,
  {
    metadata,
    chainIdNumber,
  }: {
    metadata: TokenMetadata | null;
    chainIdNumber: number;
  }
): NotaActionContext {
  const account = addressForPreviewRole(role, base);
  const moduleData =
    buildModuleDataFromTokenUri({
      hookAddress: base.hook,
      chainIdNumber,
      metadata,
      escrowWei: base.escrowWei,
      owner: base.owner,
      account,
    }) ?? UNKNOWN_MODULE_DATA;

  return { ...base, moduleData, viewer: account.toLowerCase() };
}
