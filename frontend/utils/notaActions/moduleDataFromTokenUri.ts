import {
  contractMappingForChainId,
  ModuleData,
  NotaStatuses,
} from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { getMetadataDateAttribute, TokenMetadata } from "../notaTokenUri";
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
  const mapping = contractMappingForChainId(chainIdNumber);
  if (!mapping) {
    return null;
  }

  const hook = hookAddress.toLowerCase();
  const inspector = extractInspectorFromMetadata(metadata);
  const externalURI = metadata?.external_url ?? "";
  const imageURI = metadata?.image ?? "";

  if (hook === mapping.reversibleRelease.toLowerCase()) {
    return {
      moduleName: "reversibleRelease",
      status: reversibleInspectorStatus(escrowWei, inspector, account),
      writeBytes: "",
      inspector: inspector ?? "",
      externalURI,
      imageURI,
    } as ModuleData;
  }

  if (hook === mapping.reversibleByBeforeDate.toLowerCase()) {
    const inspectionEnd = getMetadataDateAttribute(metadata, "Inspection End");
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

  if (hook === mapping.cashBeforeDate.toLowerCase()) {
    const expirationDate = getMetadataDateAttribute(metadata, "Expiration Date");
    return {
      moduleName: "cashBeforeDate",
      status: cashBeforeDateStatus(escrowWei, owner, account, expirationDate),
      writeBytes: "",
      cashBeforeDate: expirationDate ?? new Date(0),
      externalURI,
      imageURI,
    } as ModuleData;
  }

  if (hook === mapping.simpleCash.toLowerCase()) {
    const status = escrowWei.isZero()
      ? "claimed"
      : owner.toLowerCase() === account.toLowerCase()
        ? "claimable"
        : "awaiting_claim";
    return {
      moduleName: "simpleCash",
      status,
      writeBytes: "",
      externalURI,
      imageURI,
    };
  }

  if (hook === mapping.directSend.toLowerCase()) {
    return {
      moduleName: "directSend",
      status: "paid",
      writeBytes: "",
      externalURI,
      imageURI,
    };
  }

  return null;
}
