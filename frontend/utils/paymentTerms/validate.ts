import { ethers } from "ethers";
import { classifyAccountInput, isAccountInputInProgress } from "../accountIdentity";
import { resolveDripPeriodSeconds } from "../dripPeriod";
import { expirationDateToCashBeforeDateMs } from "../expirationDate";
import {
  giftSignSettingsApply,
  releaseCanBePaused,
  type PaymentTermsErrors,
  type PaymentTermsValues,
} from "./types";

export interface ValidateTermsContext {
  /** Escrow amount from the Basic information step. */
  amount: string | undefined;
  tokenLabel: string;
  now?: Date;
  /**
   * ERC-721 check for the typed collection, when it matches
   * `nftCollectionAddress`. `null` means still checking or not yet run.
   */
  nftCollectionIsErc721?: boolean | null;
}

function dateMs(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const ms = expirationDateToCashBeforeDateMs(trimmed);
  return Number.isFinite(ms) ? ms : null;
}

function isAddressLike(value: string): boolean {
  const kind = classifyAccountInput(value);
  return kind !== "empty" && kind !== "invalid";
}

function accountFieldError(
  input: string,
  resolved: string,
  emptyMessage: string
): string | undefined {
  const trimmed = input.trim();
  if (!trimmed) {
    return emptyMessage;
  }
  if (ethers.utils.isAddress(trimmed)) {
    return undefined;
  }
  const kind = classifyAccountInput(trimmed);
  if (kind === "ens") {
    return ethers.utils.isAddress(resolved)
      ? undefined
      : "ENS name hasn't resolved to an address.";
  }
  if (kind === "email") {
    return ethers.utils.isAddress(resolved)
      ? undefined
      : "No wallet found for this email.";
  }
  if (kind === "phone") {
    return ethers.utils.isAddress(resolved)
      ? undefined
      : "No wallet found for this phone number.";
  }
  if (isAccountInputInProgress(kind)) {
    return undefined;
  }
  return "Not a valid email, phone, ENS name, or 0x address";
}

function listEntries(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function allowlistError(value: string, emptyMessage: string): string | undefined {
  const entries = listEntries(value);
  if (entries.length < 1) {
    return emptyMessage;
  }
  if (entries.some((entry) => !isAddressLike(entry))) {
    return "One of the entries is not a valid address.";
  }
  return undefined;
}

/**
 * Relational validation for the Payment Terms screen. Presence checks alone
 * are not enough: a date in the past or an end before a start encodes into
 * valid-looking hookData that produces a dead or exploitable nota. Messages
 * are shown inline next to the offending field and block Continue.
 */
export function validatePaymentTerms(
  values: PaymentTermsValues,
  ctx: ValidateTermsContext
): PaymentTermsErrors {
  const errors: PaymentTermsErrors = {};
  const nowMs = (ctx.now ?? new Date()).getTime();
  const total = Number(ctx.amount);
  const totalLabel = `${ctx.amount?.trim() || "0"} ${ctx.tokenLabel}`.trim();

  if (values.specialized) {
    switch (values.specialized) {
      case "customHook":
        if (!ethers.utils.isAddress(values.customHookAddress.trim())) {
          errors.customHookAddress = "Paste a valid hook contract address.";
        }
        break;
      case "timelockPromise": {
        const ms = dateMs(values.releaseDate);
        if (ms === null) {
          errors.releaseDate = "Pick an unlock date.";
        } else if (ms <= nowMs) {
          errors.releaseDate =
            "That date is in the past. Pick a future date.";
        }
        const firstHalf = Number(values.firstHalfAmount);
        if (
          !values.firstHalfAmount.trim() ||
          !Number.isFinite(firstHalf) ||
          firstHalf < 0
        ) {
          errors.firstHalfAmount = "Locked pay must be 0 or more.";
        } else if (Number.isFinite(total) && total > 0 && firstHalf > total) {
          errors.firstHalfAmount = `That is more than the full ${totalLabel}.`;
        }
        break;
      }
      case "forwarderReverser": {
        const error = accountFieldError(
          values.reverserAddress,
          values.resolvedReverserAddress,
          "Enter the reverser's email, phone, ENS name, or address."
        );
        if (error) {
          errors.reverserAddress = error;
        }
        break;
      }
      case "reversibleBeforeDelayable": {
        const ms = dateMs(values.inspectionEndDate);
        if (ms === null) {
          errors.inspectionEndDate = "Pick a date.";
        } else if (ms <= nowMs) {
          errors.inspectionEndDate =
            "That date is in the past. Pick a future date.";
        }
        const cost = Number(values.delayCostPerDay);
        if (
          !values.delayCostPerDay.trim() ||
          !Number.isFinite(cost) ||
          cost <= 0
        ) {
          errors.delayCostPerDay = "Cost to extend must be more than 0.";
        }
        break;
      }
      case "reversibleStartsLocked": {
        const ms = dateMs(values.inspectionEndDate);
        if (ms === null) {
          errors.inspectionEndDate = "Pick a date.";
        } else if (ms <= nowMs) {
          errors.inspectionEndDate =
            "That date is in the past. Pick a future date.";
        }
        break;
      }
      default:
        break;
    }
    return errors;
  }

  switch (values.term) {
    case "":
      return errors;

    case "recipientClaims": {
      if (values.claimWhen === "beforeDeadline") {
        const ms = dateMs(values.claimDeadline);
        if (ms === null) {
          errors.claimDeadline = "Pick a deadline.";
        } else if (ms <= nowMs) {
          errors.claimDeadline =
            "That date is in the past. Pick a future deadline.";
        }
      }
      break;
    }

    case "someoneReviews": {
      if (values.reviewer === "other") {
        const error = accountFieldError(
          values.reviewerAddress,
          values.resolvedReviewerAddress,
          "Enter the reviewer's email, phone, ENS name, or address."
        );
        if (error) {
          errors.reviewerAddress = error;
        }
      }
      if (
        (values.reviewer === "me" || values.reviewer === "other") &&
        values.refundWindow === "untilDate"
      ) {
        const ms = dateMs(values.inspectionEndDate);
        if (ms === null) {
          errors.inspectionEndDate = "Pick a date.";
        } else if (ms <= nowMs) {
          errors.inspectionEndDate =
            "That date is in the past. Pick a future date.";
        }
      }
      if (values.reviewer === "group") {
        const signers = values.groupSigners
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (signers.length < 2) {
          errors.groupSigners = "Add at least two signers, one per line.";
        } else if (signers.some((s) => !isAddressLike(s))) {
          errors.groupSigners = "One of the signers is not a valid address.";
        }
        const threshold = Number(values.groupThreshold);
        if (!Number.isInteger(threshold) || threshold < 1) {
          errors.groupThreshold =
            "Threshold must be a whole number of 1 or more.";
        } else if (signers.length >= 2 && threshold > signers.length) {
          errors.groupThreshold = `Threshold can't exceed the ${signers.length} signers.`;
        }
      }
      break;
    }

    case "releaseOverTime": {
      switch (values.releaseSchedule) {
        case "specificDate": {
          const ms = dateMs(values.releaseDate);
          if (ms === null) {
            errors.releaseDate = "Pick a release date.";
          } else if (ms <= nowMs) {
            errors.releaseDate =
              "That date is in the past. Pick a future date.";
          }
          break;
        }
        case "recurring": {
          const chunk = Number(values.chunkAmount);
          if (
            !values.chunkAmount.trim() ||
            !Number.isFinite(chunk) ||
            chunk <= 0
          ) {
            errors.chunkAmount = "Amount per release must be more than 0.";
          } else if (Number.isFinite(total) && total > 0 && chunk > total) {
            errors.chunkAmount = `That is more than the full ${totalLabel}.`;
          }
          const periodSeconds = resolveDripPeriodSeconds({
            dripPeriodPreset: values.chunkPeriodPreset,
            dripPeriodAmount: values.chunkPeriodAmount,
            dripPeriodUnit: values.chunkPeriodUnit,
          });
          if (values.chunkPeriodPreset === "custom" && periodSeconds <= 0) {
            errors.chunkPeriodAmount = "Frequency must be at least 1.";
          }
          if (values.unclaimedBehavior === "return") {
            const ms = dateMs(values.returnAfterDate);
            if (ms === null) {
              errors.returnAfterDate = "Pick a return date.";
            } else if (ms <= nowMs) {
              errors.returnAfterDate = "Return date must be after the start.";
            }
          }
          break;
        }
        case "stream": {
          const start = dateMs(values.streamStart);
          const end = dateMs(values.streamEnd);
          if (start === null) {
            errors.streamStart = "Pick a start date.";
          }
          if (end === null) {
            errors.streamEnd = "Pick an end date.";
          } else if (start !== null && end <= start) {
            errors.streamEnd = "End must be after the start date.";
          }
          break;
        }
        default:
          break;
      }
      if (
        releaseCanBePaused(values.releaseSchedule) &&
        values.releasePausable === "yes" &&
        values.pauseBy === "reviewer"
      ) {
        const error = accountFieldError(
          values.pauseReviewerAddress,
          values.resolvedPauseReviewerAddress,
          "Enter the reviewer's email, phone, ENS name, or address."
        );
        if (error) {
          errors.pauseReviewerAddress = error;
        }
      }
      break;
    }

    case "conditionMet": {
      switch (values.conditionTrigger) {
        case "ownership": {
          const address = values.nftCollectionAddress.trim();
          if (!address) {
            errors.nftCollectionAddress =
              "Enter the collection's contract address.";
          } else if (!ethers.utils.isAddress(address)) {
            errors.nftCollectionAddress = "Not a valid 0x address.";
          } else if (ctx.nftCollectionIsErc721 === false) {
            errors.nftCollectionAddress =
              "Contract does not implement ERC-721 (EIP-165)";
          }
          const threshold = Number(values.nftBalanceThreshold);
          if (
            !values.nftBalanceThreshold.trim() ||
            !Number.isInteger(threshold) ||
            threshold < 0
          ) {
            errors.nftBalanceThreshold =
              "Required balance must be a whole number of 0 or more.";
          }
          const ms = dateMs(values.conditionExpiration);
          if (ms === null) {
            errors.conditionExpiration = "Pick an expiration date.";
          } else if (ms <= nowMs) {
            errors.conditionExpiration =
              "That date is in the past. Pick a future date.";
          }
          break;
        }
        case "price": {
          if (!values.priceAsset.trim()) {
            errors.priceAsset = "Name the asset to watch.";
          }
          const target = Number(values.priceTarget);
          if (
            !values.priceTarget.trim() ||
            !Number.isFinite(target) ||
            target <= 0
          ) {
            errors.priceTarget = "Target price must be more than 0.";
          }
          break;
        }
        case "onchainState": {
          if (!ethers.utils.isAddress(values.onchainContract.trim())) {
            errors.onchainContract = "Not a valid 0x address.";
          }
          break;
        }
        default:
          break;
      }
      break;
    }

    case "giftCard": {
      if (values.giftFundWho === "allowlist") {
        const error = allowlistError(
          values.giftFundAllowlist,
          "Add at least one person who can fund it."
        );
        if (error) {
          errors.giftFundAllowlist = error;
        }
      }
      if (values.giftSignWho === "allowlist") {
        const error = allowlistError(
          values.giftSignAllowlist,
          "Add at least one person who can sign."
        );
        if (error) {
          errors.giftSignAllowlist = error;
        }
      }
      if (
        giftSignSettingsApply(values.giftSignWho) &&
        values.giftSignCost === "minEscrow"
      ) {
        const min = Number(values.giftMinSignAmount);
        if (
          !values.giftMinSignAmount.trim() ||
          !Number.isFinite(min) ||
          min <= 0
        ) {
          errors.giftMinSignAmount = "Minimum must be more than 0.";
        }
      }
      if (values.giftUnclaimed === "return") {
        const ms = dateMs(values.giftReturnDate);
        if (ms === null) {
          errors.giftReturnDate = "Pick a return date.";
        } else if (ms <= nowMs) {
          errors.giftReturnDate =
            "That date is in the past. Pick a future date.";
        }
      }
      break;
    }
  }

  return errors;
}
