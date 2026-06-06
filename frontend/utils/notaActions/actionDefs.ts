import {
  MdAccountBalanceWallet,
  MdAutorenew,
  MdLocalFireDepartment,
  MdMonetizationOn,
  MdSend,
} from "react-icons/md";
import { ActionDef } from "./types";

export const ACTION_DEFS: Record<string, ActionDef> = {
  transfer: {
    id: "transfer",
    label: "Transfer",
    icon: MdSend,
    risk: "normal",
    roles: ["owner", "approved"],
    note: "Escrow travels with the nota to the new owner.",
    fields: [
      {
        name: "to",
        label: "Recipient address",
        type: "address",
        placeholder: "0x… or name.eth",
      },
    ],
  },
  fund: {
    id: "fund",
    label: "Fund",
    icon: MdAccountBalanceWallet,
    risk: "normal",
    roles: ["owner", "approved", "payer", "inspector", "stranger"],
    erc20: true,
    fields: [
      {
        name: "escrow",
        label: "Escrow amount",
        type: "amount",
        placeholder: "0.0",
        hint: "Funds held in the nota",
      },
      {
        name: "instant",
        label: "Instant amount",
        type: "amount",
        placeholder: "0.0",
        hint: "Funds sent to the owner",
      },
    ],
    isAvailable: (ctx) => ctx.moduleData.moduleName !== "directSend",
  },
  cash: {
    id: "cash",
    label: "Cash",
    icon: MdMonetizationOn,
    risk: "normal",
    roles: ["owner", "approved", "inspector"],
    note: "Withdraw escrow to a destination address.",
    fields: [
      {
        name: "escrow",
        label: "Amount",
        type: "amount",
        placeholder: "0.0",
      },
      {
        name: "to",
        label: "Send to",
        type: "address",
        placeholder: "0x…",
      },
    ],
    isAvailable: (ctx) =>
      !ctx.escrowWei.isZero() &&
      ctx.moduleData.moduleName !== "directSend" &&
      ctx.moduleData.moduleName !== "unknown",
  },
  update: {
    id: "update",
    label: "Update",
    icon: MdAutorenew,
    risk: "normal",
    roles: ["owner", "approved", "payer", "inspector", "stranger"],
    note: "Send hook-defined data to advance the nota's state.",
    fields: [
      {
        name: "hookData",
        label: "Hook data (hex)",
        type: "text",
        placeholder: "0x…",
      },
    ],
  },
  burn: {
    id: "burn",
    label: "Burn",
    icon: MdLocalFireDepartment,
    risk: "destructive",
    roles: ["owner", "approved"],
    note: "Destroys the nota and returns any remaining escrow to you. Irreversible.",
    confirm: true,
    fields: [],
  },
};
