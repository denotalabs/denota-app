import { ModuleData } from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { IconType } from "react-icons";

export type NotaRole =
  | "owner"
  | "approved"
  | "inspector"
  | "payer"
  | "stranger";

export type ActionId = "transfer" | "fund" | "cash" | "update" | "burn";

export type ActionRisk = "normal" | "warning" | "destructive";

export type FieldType = "address" | "amount" | "text";

export interface ActionField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  tooltipLabel?: string;
}

export interface ActionBranch {
  key: string;
  label: string;
  to: (ctx: NotaActionContext) => string;
  tone: "go" | "back";
}

export interface NotaActionContext {
  id: string;
  owner: string;
  approved: string | null;
  sender: string | null;
  receiver: string | null;
  escrow: string;
  escrowWei: BigNumber;
  currency: string;
  currencySymbol: string;
  hook: string;
  moduleData: ModuleData;
  inspector: string | null;
}

export interface ActionDef {
  id: ActionId;
  label: string;
  icon: IconType;
  risk: ActionRisk;
  roles: NotaRole[];
  note?: string;
  fields: ActionField[];
  erc20?: boolean;
  confirm?: boolean;
  branch?: boolean;
  branches?: ActionBranch[];
  isAvailable?: (ctx: NotaActionContext) => boolean;
}

export type ResolvedAction = ActionDef;

export interface ActionFormValues {
  to?: string;
  escrow?: string;
  instant?: string;
  hookData?: string;
  branch?: string;
}
