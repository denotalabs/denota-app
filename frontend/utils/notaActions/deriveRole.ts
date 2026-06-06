import { NotaRole } from "./types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

interface RoleInput {
  owner: string | null;
  approved: string | null;
  sender: string | null;
  inspector: string | null;
}

export function deriveNotaRole(
  wallet: string | null | undefined,
  { owner, approved, sender, inspector }: RoleInput
): NotaRole {
  const w = (wallet || "").toLowerCase();
  if (!w) {
    return "stranger";
  }
  if (owner && w === owner.toLowerCase()) {
    return "owner";
  }
  if (
    approved &&
    approved !== ZERO_ADDRESS &&
    w === approved.toLowerCase()
  ) {
    return "approved";
  }
  if (inspector && w === inspector.toLowerCase()) {
    return "inspector";
  }
  if (sender && w === sender.toLowerCase()) {
    return "payer";
  }
  return "stranger";
}
