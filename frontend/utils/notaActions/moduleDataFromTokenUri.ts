import { ModuleData, NotaStatuses } from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { traitLabelToConditionType } from "../balanceOfConditionalCash";
import { onChainDripPeriodSeconds } from "../dripPeriod";
import {
  getMetadataAttribute,
  getMetadataDateAttribute,
  TokenMetadata,
} from "../notaTokenUri";
import { hookModuleName } from "./hookRegistry";
import { TRAIT } from "./metadataTraits";
import { extractInspectorFromMetadata } from "./metadataRoles";

function reversibleInspectorStatus(
  escrowWei: BigNumber,
  inspector: string | null,
  account: string
): NotaStatuses {
  if (escrowWei.isZero()) {
    return "released";
  }
  if (inspector === account.toLowerCase()) {
    return "releasable";
  }
  return "returnable";
}

function reversibleByBeforeDateStatus(
  escrowWei: BigNumber,
  inspector: string | null,
  account: string,
  inspectionEnd: Date | null
): NotaStatuses {
  if (escrowWei.isZero()) {
    return "released";
  }
  const ended = inspectionEnd !== null && inspectionEnd.getTime() < Date.now();
  if (ended) {
    return inspector === account.toLowerCase() ? "awaiting_claim" : "claimable";
  }
  return inspector === account.toLowerCase()
    ? "releasable"
    : "awaiting_release";
}

function balanceOfConditionalCashStatus(
  escrowWei: BigNumber,
  owner: string,
  account: string,
  sender: string | null,
  expirationDate: Date | null
): NotaStatuses {
  if (escrowWei.isZero()) {
    return "claimed";
  }
  const beforeExpiry =
    expirationDate === null || expirationDate.getTime() >= Date.now();
  if (beforeExpiry) {
    return owner.toLowerCase() === account.toLowerCase()
      ? "claimable"
      : "awaiting_claim";
  }
  if (sender?.toLowerCase() === account.toLowerCase()) {
    return "returnable";
  }
  if (owner.toLowerCase() === account.toLowerCase()) {
    return "expired";
  }
  return "awaiting_claim";
}

function cashBeforeDateStatus(
  escrowWei: BigNumber,
  owner: string,
  account: string,
  expirationDate: Date | null
): NotaStatuses {
  if (escrowWei.isZero()) {
    return "claimed";
  }
  const beforeExpiry =
    expirationDate === null || expirationDate.getTime() >= Date.now();
  if (beforeExpiry) {
    return owner.toLowerCase() === account.toLowerCase()
      ? "claimable"
      : "awaiting_claim";
  }
  return owner.toLowerCase() === account.toLowerCase()
    ? "expired"
    : "returnable";
}

function toBigNumber(raw: string | null): BigNumber {
  try {
    return BigNumber.from(raw?.trim() || "0");
  } catch {
    return BigNumber.from(0);
  }
}

/**
 * Drip behaves like cash-before-date, except the owner can only claim once per
 * period — within a period already drawn from, the escrow is locked.
 */
function cashBeforeDateDripStatus(
  escrowWei: BigNumber,
  owner: string,
  account: string,
  expirationDate: Date | null,
  lastCashed: Date | null,
  periodSeconds: number
): NotaStatuses {
  const status = cashBeforeDateStatus(
    escrowWei,
    owner,
    account,
    expirationDate
  );
  if (status !== "claimable" || !lastCashed || periodSeconds <= 0) {
    return status;
  }
  const nextClaimMs = lastCashed.getTime() + periodSeconds * 1000;
  return nextClaimMs > Date.now() ? "locked" : "claimable";
}

export function buildModuleDataFromTokenUri({
  hookAddress,
  chainIdNumber,
  metadata,
  escrowWei,
  owner,
  account,
}: {
  hookAddress: string;
  chainIdNumber: number;
  metadata: TokenMetadata | null;
  escrowWei: BigNumber;
  owner: string;
  account: string;
}): ModuleData | null {
  const module = hookModuleName(hookAddress, chainIdNumber);
  if (!module) {
    return null;
  }

  const inspector = extractInspectorFromMetadata(metadata);
  const externalURI = metadata?.external_url ?? "";
  const imageURI = metadata?.image ?? "";

  switch (module) {
    case "reversibleRelease":
      return {
        moduleName: "reversibleRelease",
        status: reversibleInspectorStatus(escrowWei, inspector, account),
        writeBytes: "",
        inspector: inspector ?? "",
        externalURI,
        imageURI,
      } as ModuleData;

    case "reversibleByBeforeDate": {
      const inspectionEnd = getMetadataDateAttribute(
        metadata,
        TRAIT.inspectionEnd
      );
      return {
        moduleName: "reversibleByBeforeDate",
        status: reversibleByBeforeDateStatus(
          escrowWei,
          inspector,
          account,
          inspectionEnd
        ),
        writeBytes: "",
        inspector: inspector ?? "",
        reversibleByBeforeDate: inspectionEnd ?? new Date(0),
        externalURI,
        imageURI,
      } as ModuleData;
    }

    case "cashBeforeDate": {
      const expirationDate = getMetadataDateAttribute(
        metadata,
        TRAIT.expirationDate
      );
      return {
        moduleName: "cashBeforeDate",
        status: cashBeforeDateStatus(escrowWei, owner, account, expirationDate),
        writeBytes: "",
        cashBeforeDate: expirationDate ?? new Date(0),
        externalURI,
        imageURI,
      } as ModuleData;
    }

    case "cashBeforeDateDrip": {
      const expirationDate = getMetadataDateAttribute(
        metadata,
        TRAIT.expirationDate
      );
      const lastCashed = getMetadataDateAttribute(metadata, TRAIT.lastCashed);
      const dripPeriod = getMetadataAttribute(metadata, TRAIT.dripPeriod);
      // The cash flow forwards dripAmount straight to the SDK as the claim
      // amount, so it has to be the raw on-chain value.
      const dripAmount = toBigNumber(
        getMetadataAttribute(metadata, TRAIT.dripAmount)
      );
      return {
        moduleName: "cashBeforeDateDrip",
        status: cashBeforeDateDripStatus(
          escrowWei,
          owner,
          account,
          expirationDate,
          lastCashed,
          onChainDripPeriodSeconds(dripPeriod)
        ),
        writeBytes: "",
        expirationDate: expirationDate ?? new Date(0),
        lastCashed: lastCashed ?? new Date(0),
        dripAmount,
        dripPeriod: dripPeriod ?? "",
        externalURI,
        imageURI,
      } as unknown as ModuleData;
    }

    case "simpleCash":
      return {
        moduleName: "simpleCash",
        status: escrowWei.isZero()
          ? "claimed"
          : owner.toLowerCase() === account.toLowerCase()
            ? "claimable"
            : "awaiting_claim",
        writeBytes: "",
        externalURI,
        imageURI,
      };

    case "directSend":
      return {
        moduleName: "directSend",
        status: "paid",
        writeBytes: "",
        externalURI,
        imageURI,
      };

    case "balanceOfConditionalCash": {
      const expirationDate = getMetadataDateAttribute(
        metadata,
        TRAIT.expirationDate
      );
      const sender = getMetadataAttribute(metadata, TRAIT.sender);
      const conditionTypeTrait = getMetadataAttribute(
        metadata,
        TRAIT.conditionType
      );
      return {
        moduleName: "balanceOfConditionalCash",
        status: balanceOfConditionalCashStatus(
          escrowWei,
          owner,
          account,
          sender,
          expirationDate
        ),
        writeBytes: "",
        nftCollectionAddress:
          getMetadataAttribute(metadata, TRAIT.nftAddress) ?? "",
        conditionType:
          traitLabelToConditionType(conditionTypeTrait) ??
          conditionTypeTrait ??
          "",
        nftBalanceThreshold:
          getMetadataAttribute(metadata, TRAIT.thresholdNumber) ?? "",
        sender: sender ?? "",
        expirationDate: expirationDate ?? new Date(0),
        externalURI,
        imageURI,
      } as unknown as ModuleData;
    }
  }
}
