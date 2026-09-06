import type { ConditionType } from "../balanceOfConditionalCash";
import type { DripPeriodPreset, DripPeriodUnit } from "../dripPeriod";

/** The five common outcomes, in display order. */
export const PAYMENT_TERM_IDS = [
  "recipientClaims",
  "someoneReviews",
  "releaseOverTime",
  "conditionMet",
  "payMultiple",
] as const;
export type PaymentTermId = (typeof PAYMENT_TERM_IDS)[number];

export type ClaimWhen = "anytime" | "beforeDeadline";
export type ClaimDestination = "recipient" | "anyAddress";

export type Reviewer = "me" | "other" | "group" | "arbitration";
export type RefundWindow = "untilDecide" | "untilDate";
export type ArbitrationProvider = "kleros" | "ai" | "privateVoting";

export type ReleaseSchedule =
  | "specificDate"
  | "recurring"
  | "stream"
  | "milestones"
  | "customVesting";
export type UnclaimedBehavior = "stay" | "return";

export type ConditionTrigger =
  | "ownership"
  | "price"
  | "onchainState"
  | "attestation";
export type PriceDirection = "above" | "below";
export type OnchainUnlock = "succeeds" | "returnValue";
export type AttestationKind = "eas" | "coinbaseKyc" | "hats" | "zk";

export type Distribution = "fixedSplit" | "inOrder" | "sharedPot";
export type SharedPotKind = "fundraiser" | "rotatingSavings" | "roundRobin";

export type SpecializedOption =
  | ""
  | "bills"
  | "compliance"
  | "probabilistic"
  | "onchainChat"
  | "timelockPromise"
  | "forwarderReverser"
  | "reversibleBeforeDelayable"
  | "reversibleStartsLocked"
  | "customHook";

/**
 * Every answer the Payment Terms screen can collect. Fields are only shown
 * when prior answers make them relevant; unused fields keep their seed.
 */
export interface PaymentTermsValues {
  term: PaymentTermId | "";
  specialized: SpecializedOption;

  // Recipient claims it
  claimWhen: ClaimWhen;
  claimDeadline: string;
  claimDestination: ClaimDestination;

  // Someone reviews it
  reviewer: Reviewer;
  reviewerAddress: string;
  resolvedReviewerAddress: string;
  refundWindow: RefundWindow;
  inspectionEndDate: string;
  groupSigners: string;
  groupThreshold: string;
  arbitrationProvider: ArbitrationProvider;

  // Release it over time
  releaseSchedule: ReleaseSchedule;
  releaseDate: string;
  allowEarlyRelease: boolean;
  chunkAmount: string;
  chunkPeriodPreset: DripPeriodPreset;
  chunkPeriodAmount: string;
  chunkPeriodUnit: DripPeriodUnit;
  unclaimedBehavior: UnclaimedBehavior;
  returnAfterDate: string;
  streamStart: string;
  streamEnd: string;

  // Release when a condition is met
  conditionTrigger: ConditionTrigger;
  nftCollectionAddress: string;
  conditionType: ConditionType;
  nftBalanceThreshold: string;
  conditionExpiration: string;
  priceAsset: string;
  priceDirection: PriceDirection;
  priceTarget: string;
  onchainContract: string;
  onchainCalldata: string;
  onchainUnlock: OnchainUnlock;
  onchainCondition: ConditionType;
  onchainExpected: string;
  attestationKind: AttestationKind;

  // Pay multiple people
  distribution: Distribution;
  sharedPotKind: SharedPotKind;

  // More specialized options
  firstHalfAmount: string;
  delayCostPerDay: string;
  reverserAddress: string;
  resolvedReverserAddress: string;
  customHookAddress: string;
}

export type PaymentTermsErrors = Partial<
  Record<keyof PaymentTermsValues, string>
>;

/** Formik `status` for async checks the sync validator reads via a ref. */
export interface PaymentTermsFormStatus {
  erc721Checking?: boolean;
  erc721Address?: string;
  erc721IsErc721?: boolean | null;
}
