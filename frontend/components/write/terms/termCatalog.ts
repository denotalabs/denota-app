import {
  CalendarClock,
  Code,
  HandCoins,
  KeyRound,
  UserCheck,
  Users,
  type LucideIcon
} from "lucide-react";
import type {
  PaymentTermId,
  SpecializedOption,
} from "../../../utils/paymentTerms/types";

export interface TermCatalogEntry {
  id: PaymentTermId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

/** The five common outcomes, phrased as results, in the specified order. */
export const TERM_CATALOG: TermCatalogEntry[] = [
  {
    id: "recipientClaims",
    title: "Recipient claims it",
    subtitle: "Funds wait in escrow until the recipient takes them.",
    icon: HandCoins,
  },
  {
    id: "someoneReviews",
    title: "Someone reviews it",
    subtitle: "A reviewer can release the funds or refund them to you.",
    icon: UserCheck,
  },
  {
    id: "releaseOverTime",
    title: "Release it over time",
    subtitle: "On a date, in chunks, or as a continuous stream.",
    icon: CalendarClock,
  },
  {
    id: "conditionMet",
    title: "Release when a condition is met",
    subtitle: "Ownership, price, or another onchain fact unlocks it.",
    icon: KeyRound,
  },
  {
    id: "payMultiple",
    title: "Pay multiple people",
    subtitle: "Split it, pay in order, or fund a shared pot.",
    icon: Users,
  },
];

export interface SpecializedCatalogEntry {
  id: Exclude<SpecializedOption, "">;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Dimmed and non-selectable. */
  comingSoon?: boolean;
  /** Rendered with an "Advanced" tag. */
  advanced?: boolean;
}

/** Instrument-like and experimental options, kept out of the primary five. */
export const SPECIALIZED_CATALOG: SpecializedCatalogEntry[] = [
  // {
  //   id: "bills",
  //   title: "Transferable bills",
  //   subtitle: "Issue a bill the holder can trade or redeem.",
  //   icon: FileText,
  // },
  // {
  //   id: "compliance",
  //   title: "Compliance-controlled payments",
  //   subtitle: "Only allowlisted addresses can receive or forward funds.",
  //   icon: ShieldCheck,
  // },
  // {
  //   id: "probabilistic",
  //   title: "Probabilistic payments",
  //   subtitle: "Pay out with a set probability instead of a fixed amount.",
  //   icon: Dices,
  //   comingSoon: true,
  // },
  // {
  //   id: "onchainChat",
  //   title: "Onchain chat / social notas",
  //   subtitle: "Attach the payment to an onchain conversation.",
  //   icon: MessageSquare,
  //   comingSoon: true,
  // },
  {
    id: "customHook",
    title: "Custom hook address",
    subtitle: "Paste a hook contract you already trust.",
    icon: Code,
    advanced: true,
  },
];

/** Card header (title, subtitle, icon) for whichever option is promoted. */
export function promotedEntry(
  term: PaymentTermId | "",
  specialized: SpecializedOption
): TermCatalogEntry | SpecializedCatalogEntry | null {
  if (specialized) {
    return (
      SPECIALIZED_CATALOG.find((option) => option.id === specialized) ?? null
    );
  }
  if (term) {
    return TERM_CATALOG.find((entry) => entry.id === term) ?? null;
  }
  return null;
}
