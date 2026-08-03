import { contractMappingForChainId, state } from "@denota-labs/denota-sdk";
import { ethers } from "ethers";
import { dateTimeLocalOneMonthFromNow } from "./expirationDate";

export const BALANCE_OF_CONDITIONAL_CASH_MODULE = "balanceOfConditionalCash";

/** Shown wherever NFT collection on-chain checks are explained. */
export const NFT_COLLECTION_SPOOFING_NOTICE =
  "On-chain checks only confirm ERC-721 interface support. Contract names can be spoofed—verify the collection address against official sources before paying.";

/** Key on SDK `contractMapping` / `contractMappingForChainId` results. */
export const BALANCE_OF_CONDITIONAL_CASH_HOOK_KEY = "balanceOfConditionalCash";

/** Temporary fallback until SDK contract mapping includes this hook. */
export const BALANCE_OF_CONDITIONAL_CASH_HOOK_ADDRESS_FALLBACK =
  "0x00000000373Cbb1B1dfFbaB531Ea4EdB297A6182";

export const CONDITION_TYPES = ["LT", "GT", "EQ", "LTEQ", "GTEQ"] as const;
export type ConditionType = (typeof CONDITION_TYPES)[number];

export const CONDITION_TYPE_LABELS: Record<ConditionType, string> = {
  LT: "Less than",
  GT: "Greater than",
  EQ: "Equal to",
  LTEQ: "Less than or equal to",
  GTEQ: "Greater than or equal to",
};

/** Comparison read as prose, e.g. "at least 2 NFTs from …". */
export const CONDITION_TYPE_PHRASES: Record<ConditionType, string> = {
  LT: "fewer than",
  GT: "more than",
  EQ: "exactly",
  LTEQ: "at most",
  GTEQ: "at least",
};

/** Stand-in used when the collection address is missing or unreadable. */
export const NFT_COLLECTION_FALLBACK_LABEL = "the specified collection";

/** e.g. "1 NFT" / "2 NFTs", for reading a threshold as prose. */
export function nftCountPhrase(threshold: string): string {
  return threshold === "1" ? "1 NFT" : `${threshold} NFTs`;
}

/** Maps form shorthand to the trait string emitted by the hook's tokenURI. */
export const CONDITION_TYPE_TRAIT_LABELS: Record<ConditionType, string> = {
  LT: "Less Than",
  GT: "Greater Than",
  EQ: "Equal To",
  LTEQ: "Less Than or Equal To",
  GTEQ: "Greater Than or Equal To",
};

/** Solidity enum order: LT=0, GT=1, EQ=2, LTEQ=3, GTEQ=4 */
export function conditionTypeToEnum(type: ConditionType): number {
  return CONDITION_TYPES.indexOf(type);
}

export function traitLabelToConditionType(
  label: string | null | undefined
): ConditionType | null {
  if (!label?.trim()) {
    return null;
  }
  const entry = Object.entries(CONDITION_TYPE_TRAIT_LABELS).find(
    ([, traitLabel]) => traitLabel.toLowerCase() === label.trim().toLowerCase()
  );
  return entry ? (entry[0] as ConditionType) : null;
}

export function defaultBalanceOfConditionalCashFormValues() {
  return {
    nftCollectionAddress: "",
    conditionType: "GTEQ" as ConditionType,
    nftBalanceThreshold: "1",
    expirationDate: dateTimeLocalOneMonthFromNow(),
  };
}

function readHookFromMapping(
  mapping: Record<string, string> | undefined
): string | undefined {
  const raw = mapping?.[BALANCE_OF_CONDITIONAL_CASH_HOOK_KEY]?.trim();
  if (!raw || !ethers.utils.isAddress(raw)) {
    return undefined;
  }
  return raw;
}

/** Hook address from SDK contract mapping, with a temporary hardcoded fallback. */
export function balanceOfConditionalCashHookAddress(chainId?: number): string {
  if (chainId !== undefined) {
    const fromMapping = readHookFromMapping(
      contractMappingForChainId(chainId) as Record<string, string> | undefined
    );
    if (fromMapping) {
      return fromMapping;
    }
    return BALANCE_OF_CONDITIONAL_CASH_HOOK_ADDRESS_FALLBACK;
  }

  const fromConnectedState = readHookFromMapping(
    state.blockchainState.contractMapping as unknown as Record<string, string>
  );
  if (fromConnectedState) {
    return fromConnectedState;
  }

  if (state.blockchainState.chainId) {
    const fromChainId = readHookFromMapping(
      contractMappingForChainId(
        state.blockchainState.chainId
      ) as Record<string, string> | undefined
    );
    if (fromChainId) {
      return fromChainId;
    }
  }

  return BALANCE_OF_CONDITIONAL_CASH_HOOK_ADDRESS_FALLBACK;
}

export function isBalanceOfConditionalCashHook(
  hookAddress: string,
  chainId?: number
): boolean {
  const configured = balanceOfConditionalCashHookAddress(chainId);
  return configured.toLowerCase() === hookAddress.trim().toLowerCase();
}
