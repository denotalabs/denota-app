import { IconType } from "react-icons";
import {
  MdAdminPanelSettings,
  MdAutoAwesome,
  MdGavel,
  MdGroups,
  MdHowToVote,
  MdLock,
  MdShowChart,
  MdStorage,
} from "react-icons/md";

export type ComingSoonModuleId =
  | "llmArbitrator"
  | "zkProof"
  | "privateVoting"
  | "kleros"
  | "crowdRaise"
  | "tokenPrice"
  | "onchainState"
  | "adminSigned";

export interface ComingSoonPlaceholderField {
  label: string;
  placeholder: string;
  tooltip?: string;
}

export interface ComingSoonModule {
  id: ComingSoonModuleId;
  title: string;
  shortDescription: string;
  description: string;
  icon: IconType;
  fields: ComingSoonPlaceholderField[];
}

export const COMING_SOON_MODULES: ComingSoonModule[] = [
  {
    id: "llmArbitrator",
    title: "LLM Arbitrator",
    shortDescription:
      "An AI model resolves disputes over escrowed funds by reading submitted evidence and deciding the outcome.",
    description:
      "This hook routes a contested nota to a large language model that ingests off-chain evidence and on-chain context, then returns a verdict that controls whether escrow is cashed or returned. It depends on a verifiable inference pipeline (an oracle or coprocessor) so the model output can be trusted and audited on-chain.",
    icon: MdAutoAwesome,
    fields: [
      {
        label: "Evidence submission URL",
        placeholder: "https://...",
        tooltip: "Where parties upload dispute evidence for the model to review.",
      },
      {
        label: "Dispute window",
        placeholder: "7 days",
        tooltip: "How long either party can raise a dispute after funding.",
      },
      {
        label: "Inference oracle",
        placeholder: "0x...",
        tooltip: "Verifiable inference pipeline that attests to the model verdict.",
      },
    ],
  },
  {
    id: "zkProof",
    title: "ZK Proof",
    shortDescription:
      "Funds release only when a party submits a zero-knowledge proof satisfying some predefined condition.",
    description:
      "This hook gates a cash or fund action behind verification of a zk-SNARK or zk-STARK, letting a user prove a fact (identity, threshold, computation result) without revealing the underlying data.",
    icon: MdLock,
    fields: [
      {
        label: "Proof circuit",
        placeholder: "0x...",
        tooltip: "On-chain verifier contract for the zk proof.",
      },
      {
        label: "Condition",
        placeholder: "Balance exceeds threshold",
        tooltip: "The fact that must be proven without revealing underlying data.",
      },
    ],
  },
  {
    id: "privateVoting",
    title: "Private Voting",
    shortDescription:
      "A group decides whether to release escrow through a vote whose individual ballots stay hidden.",
    description:
      "This hook collects encrypted or commitment-based votes and only reveals the aggregate result, preventing coercion and bribery during the decision window. It typically leans on commit-reveal schemes or homomorphic tallying.",
    icon: MdHowToVote,
    fields: [
      {
        label: "Voters",
        placeholder: "0x..., 0x...",
        tooltip: "Addresses eligible to cast a private ballot.",
      },
      {
        label: "Quorum",
        placeholder: "3 of 5",
        tooltip: "Minimum votes required before tallying the result.",
      },
      {
        label: "Vote deadline",
        placeholder: "2026-06-30T23:59",
        tooltip: "Last moment a ballot can be submitted.",
      },
    ],
  },
  {
    id: "kleros",
    title: "Kleros",
    shortDescription:
      "Disputes are settled by Kleros, a live decentralized arbitration court that crowdsources jurors.",
    description:
      "This hook hands a contested nota to Kleros, where staked jurors review evidence and vote on the outcome, with the result enforced on-chain.",
    icon: MdGavel,
    fields: [
      {
        label: "Kleros court",
        placeholder: "0x...",
        tooltip: "Arbitrator contract for the selected Kleros court.",
      },
      {
        label: "Dispute deadline",
        placeholder: "2026-06-30T23:59",
        tooltip: "Last moment either party can raise a dispute.",
      },
      {
        label: "Evidence",
        placeholder: "ipfs://...",
        tooltip: "Initial meta-evidence submitted when the nota is created.",
      },
    ],
  },
  {
    id: "crowdRaise",
    title: "Crowd Raise",
    shortDescription:
      "Multiple funders contribute escrow toward a single nota, pooling capital toward a target.",
    description:
      "This hook lets many addresses call fund on the same nota, accumulating escrow until a goal is met or a deadline passes.",
    icon: MdGroups,
    fields: [
      {
        label: "Funding goal",
        placeholder: "10 ETH",
        tooltip: "Target escrow amount before release is allowed.",
      },
      {
        label: "Fundraising deadline",
        placeholder: "2026-06-30T23:59",
        tooltip: "Last moment new contributions are accepted.",
      },
    ],
  },
  {
    id: "tokenPrice",
    title: "Release on Token Price",
    shortDescription:
      "Escrow releases automatically when a token hits a target price.",
    description:
      "This hook reads a price feed and permits cashing once the asset crosses a configured threshold. It is a standard oracle integration using something like Chainlink.",
    icon: MdShowChart,
    fields: [
      {
        label: "Price feed",
        placeholder: "0x...",
        tooltip: "Oracle contract providing the token price.",
      },
      {
        label: "Target price",
        placeholder: "2000 USD",
        tooltip: "Price threshold that unlocks escrow release.",
      },
      {
        label: "Comparison",
        placeholder: "Above",
        tooltip: "Whether release triggers when price is above or below the target.",
      },
    ],
  },
  {
    id: "onchainState",
    title: "Onchain State Condition",
    shortDescription:
      "Release depends on some arbitrary on-chain state being true at cash time.",
    description:
      "This hook checks a specified storage value, balance, or contract return before allowing a fund or cash action.",
    icon: MdStorage,
    fields: [
      {
        label: "Contract",
        placeholder: "0x...",
        tooltip: "Contract whose state is checked at release time.",
      },
      {
        label: "Call data",
        placeholder: "0x...",
        tooltip: "Encoded function call whose return value is compared.",
      },
      {
        label: "Expected value",
        placeholder: "1",
        tooltip: "Return value that must match for release to proceed.",
      },
    ],
  },
  {
    id: "adminSigned",
    title: "Admin Signed",
    shortDescription:
      "A designated admin signs off to authorize release of escrow.",
    description:
      "This hook requires a signature or call from a privileged address before the action proceeds. It is the simplest possible gate — just an access-control check.",
    icon: MdAdminPanelSettings,
    fields: [
      {
        label: "Admin",
        placeholder: "0x...",
        tooltip: "Privileged address that must sign to authorize release.",
      },
      {
        label: "Certificate validity",
        placeholder: "24 hours",
        tooltip: "How long an admin signature remains valid.",
      },
    ],
  },
];

export function getComingSoonModule(
  id: ComingSoonModuleId
): ComingSoonModule | undefined {
  const hidden: ComingSoonModuleId[] = [
    "kleros",
    "tokenPrice",
    "adminSigned",
    "crowdRaise",
  ];

  return COMING_SOON_MODULES.find(
    (module) => module.id === id && !hidden.includes(module.id)
  );
}
