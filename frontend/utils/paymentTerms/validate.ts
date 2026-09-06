import { ethers } from "ethers";
import {
  classifyAccountInput,
  isPrivyIdentifierKind,
} from "../accountIdentifier";
import { resolveDripPeriodSeconds } from "../dripPeriod";
import { couldBeEnsInProgress, isEnsName } from "../ensAddress";
import { expirationDateToCashBeforeDateMs } from "../expirationDate";
import type { PaymentTermsErrors, PaymentTermsValues } from "./types";

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
  const trimmed = value.trim();
  return (
    ethers.utils.isAddress(trimmed) ||
    isEnsName(trimmed) ||
    couldBeEnsInProgress(trimmed)
  );
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
        const input = values.reverserAddress.trim();
        const resolved = values.resolvedReverserAddress.trim();
        if (!input) {
          errors.reverserAddress =
            "Enter the reverser's address, ENS name, email, or phone.";
        } else if (ethers.utils.isAddress(input)) {
          // Direct 0x: ready to encode.
        } else if (ethers.utils.isAddress(resolved)) {
          // Email, phone, or ENS already resolved.
        } else {
          const classified = classifyAccountInput(input);
          if (
            classified.kind === "ens" ||
            isPrivyIdentifierKind(classified.kind) ||
            classified.kind === "incomplete"
          ) {
            errors.reverserAddress =
              classified.message ||
              "That hasn't resolved to an address yet.";
          } else {
            errors.reverserAddress =
              classified.message ||
              "Not a valid email, phone, ENS name, or 0x address";
          }
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
        const input = values.reviewerAddress.trim();
        const resolved = values.resolvedReviewerAddress.trim();
        if (!input) {
          errors.reviewerAddress =
            "Enter the reviewer's address, ENS name, email, or phone.";
        } else if (ethers.utils.isAddress(input)) {
          // Direct 0x: ready to encode.
        } else if (ethers.utils.isAddress(resolved)) {
          // Email, phone, or ENS already resolved.
        } else {
          const classified = classifyAccountInput(input);
          if (
            classified.kind === "ens" ||
            isPrivyIdentifierKind(classified.kind) ||
            classified.kind === "incomplete"
          ) {
            errors.reviewerAddress =
              classified.message ||
              "That hasn't resolved to an address yet.";
          } else {
            errors.reviewerAddress =
              classified.message ||
              "Not a valid email, phone, ENS name, or 0x address";
          }
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

    case "payMultiple":
      break;
  }

  return errors;
}
