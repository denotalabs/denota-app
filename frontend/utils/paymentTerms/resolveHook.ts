import type { PaymentTermsValues } from "./types";

/**
 * How far along a hook is. Only `live` hooks can be written from this app;
 * everything else renders with a maturity label and blocks Continue.
 */
export type HookMaturity = "live" | "comingSoon" | "experimental" | "proposed";

/** App write-path module keys (see `useConfirmNota`). */
export type LiveModule =
  | "simpleCash"
  | "cashBeforeDate"
  | "reversibleRelease"
  | "reversibleByBeforeDate"
  | "cashBeforeDateDrip"
  | "balanceOfConditionalCash";

export interface ResolvedHook {
  /** Contract name, e.g. "ReversibleByBeforeDate". Confirm-step only. */
  contractName: string;
  maturity: HookMaturity;
  /** Set when the app can encode and write this hook today. */
  module: LiveModule | null;
}

const live = (contractName: string, module: LiveModule): ResolvedHook => ({
  contractName,
  maturity: "live",
  module,
});
const soon = (contractName: string): ResolvedHook => ({
  contractName,
  maturity: "comingSoon",
  module: null,
});
const experimental = (contractName: string): ResolvedHook => ({
  contractName,
  maturity: "experimental",
  module: null,
});
const proposed = (contractName: string): ResolvedHook => ({
  contractName,
  maturity: "proposed",
  module: null,
});

/**
 * Resolves the person's answers to a concrete hook. The UI never shows the
 * result; it only uses `maturity`/`module` to gate Continue. The contract
 * name surfaces under Technical details on Confirm.
 */
export function resolveHook(values: PaymentTermsValues): ResolvedHook | null {
  if (values.specialized) {
    switch (values.specialized) {
      case "bills":
        return soon("Bills");
      case "compliance":
        return soon("TradFi");
      case "probabilistic":
        return soon("PayMaybe");
      case "onchainChat":
        return soon("OnchainChat");
      case "timelockPromise":
        return soon("TimelockPromise");
      case "forwarderReverser":
        return soon("ForwarderReverser");
      case "reversibleBeforeDelayable":
        return soon("ReversibleByBeforeDelayable");
      case "reversibleStartsLocked":
        return soon("ReversibleStartsLocked");
      case "customHook":
        return experimental("AdminSignedActions");
    }
  }

  switch (values.term) {
    case "":
      return null;

    case "recipientClaims":
      if (values.claimDestination === "anyAddress") {
        return soon("UTXO");
      }
      return values.claimWhen === "beforeDeadline"
        ? live("CashBeforeDate", "cashBeforeDate")
        : live("SimpleCash", "simpleCash");

    case "someoneReviews":
      switch (values.reviewer) {
        case "me":
        case "other":
          return values.refundWindow === "untilDate"
            ? live("ReversibleByBeforeDate", "reversibleByBeforeDate")
            : live("ReversibleRelease", "reversibleRelease");
        case "group":
          return soon("Multisig");
        case "arbitration":
          return values.arbitrationProvider === "kleros"
            ? soon("Kleros")
            : experimental(
                values.arbitrationProvider === "ai"
                  ? "LLMArbitrator"
                  : "PrivateVoting"
              );
      }
      return null;

    case "releaseOverTime":
      switch (values.releaseSchedule) {
        case "specificDate":
          return soon(values.allowEarlyRelease ? "OneofM" : "TimelockSimple");
        case "recurring":
          return values.unclaimedBehavior === "stay"
            ? soon("DripSimple")
            : live("CashBeforeDateDrip", "cashBeforeDateDrip");
        case "stream":
          return soon("LinearStream");
        case "milestones":
          return proposed("MilestoneTranches");
        case "customVesting":
          return soon("VestingTranches");
      }
      return null;

    case "conditionMet":
      switch (values.conditionTrigger) {
        case "ownership":
          return live("BalanceOfConditionalCash", "balanceOfConditionalCash");
        case "price":
          return soon("UniswapPrice");
        case "onchainState":
          return soon(
            values.onchainUnlock === "returnValue"
              ? "CallCashCondition"
              : "CallCash"
          );
        case "attestation":
          switch (values.attestationKind) {
            case "eas":
              return soon("EASLocked");
            case "coinbaseKyc":
              return soon("CoinbaseKYC");
            case "hats":
              return soon("HatsManaged");
            case "zk":
              return experimental("ZKProof");
          }
          return null;
      }
      return null;

    case "payMultiple":
      switch (values.distribution) {
        case "fixedSplit":
          return soon("Split");
        case "inOrder":
          return soon("Waterfall");
        case "sharedPot":
          switch (values.sharedPotKind) {
            case "fundraiser":
              return soon("CrowdRaise");
            case "rotatingSavings":
              return soon("ROSCA");
            case "roundRobin":
              return soon("RoundRobin");
          }
          return null;
      }
      return null;
  }
  return null;
}

/** Human label for a maturity tag. */
export function maturityLabel(maturity: HookMaturity): string | null {
  switch (maturity) {
    case "live":
      return null;
    case "comingSoon":
      return "Coming soon";
    case "experimental":
      return "Experimental";
    case "proposed":
      return "Proposed";
  }
}
