import { contractMappingForChainId } from "@denota-labs/denota-sdk";
import { ethers } from "ethers";
import {
  balanceOfConditionalCashHookAddress,
  ConditionType,
  conditionTypeToEnum,
} from "../balanceOfConditionalCash";
import {
  DripPeriodPreset,
  DripPeriodUnit,
  resolveDripPeriodSeconds,
} from "../dripPeriod";
import { getEffectiveAddress } from "../ensAddress";
import { expirationDateToCashBeforeDateMs } from "../expirationDate";
import { normalizePaymentMetadataUris } from "../metadataUri";
import { resolveWriteModule } from "../resolveWriteModule";

export interface TechnicalDetails {
  /** Contract name, e.g. "ReversibleByBeforeDate". */
  contractName: string;
  /** Hook address on the active chain, or null when unknown. */
  hookAddress: string | null;
  /** ABI-encoded hookData exactly as the write path will send it, or null. */
  hookData: string | null;
  /** ABI parameter types, for readers who want to decode by hand. */
  abiTypes: string[];
}

const CONTRACT_NAMES: Record<string, string> = {
  directSend: "DirectSend",
  simpleCash: "SimpleCash",
  cashBeforeDate: "CashBeforeDate",
  reversibleRelease: "ReversibleRelease",
  reversibleByBeforeDate: "ReversibleByBeforeDate",
  cashBeforeDateDrip: "CashBeforeDateDrip",
  balanceOfConditionalCash: "BalanceOfConditionalCash",
};

export function hookAddressForModule(
  module: string,
  chainId: number
): string | null {
  if (module === "balanceOfConditionalCash") {
    return balanceOfConditionalCashHookAddress(chainId) ?? null;
  }
  const mapping = contractMappingForChainId(chainId) as
    | Record<string, string>
    | undefined;
  const address = mapping?.[module]?.trim();
  return address && ethers.utils.isAddress(address) ? address : null;
}

function toSeconds(dateStr: string | undefined): number | null {
  if (!dateStr?.trim()) {
    return null;
  }
  const ms = expirationDateToCashBeforeDateMs(dateStr);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

function toUnits(amount: string | undefined, decimals: number) {
  try {
    return ethers.utils.parseUnits((amount ?? "").trim() || "0", decimals);
  } catch {
    return null;
  }
}

function toAddress(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return ethers.utils.isAddress(trimmed) ? trimmed : null;
}

function toInteger(value: string | undefined): number | null {
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

/** The slice of `notaFormValues` the encoders read. */
export interface TechnicalDetailsFormValues {
  module?: string;
  expirationDate?: string;
  recoverableWhen?: string;
  inspectionEndDate?: string;
  auditor?: string;
  resolvedAuditor?: string;
  dripAmount?: string;
  dripPeriodPreset?: string;
  dripPeriodAmount?: string;
  dripPeriodUnit?: string;
  nftCollectionAddress?: string;
  conditionType?: string;
  nftBalanceThreshold?: string;
  externalURI?: string;
  imageURI?: string;
  ipfsHash?: string;
}

interface BuildInput {
  notaFormValues: TechnicalDetailsFormValues;
  chainId: number;
  connectedAccount: string;
  tokenDecimals: number;
}

/**
 * Mirrors the encoders in `hooks/modules/*` and the SDK so Confirm can show
 * the exact bytes that will be sent. Returns null when no live hook resolves;
 * `hookData` is null while any argument is still missing or invalid.
 */
export function buildTechnicalDetails({
  notaFormValues: form,
  chainId,
  connectedAccount,
  tokenDecimals,
}: BuildInput): TechnicalDetails | null {
  const module = resolveWriteModule(form);
  const contractName = CONTRACT_NAMES[module];
  if (!contractName) {
    return null;
  }

  const { externalURI, imageURI } = normalizePaymentMetadataUris(form);
  const hookAddress = hookAddressForModule(module, chainId);

  const encode = (
    types: string[],
    args: (unknown | null)[]
  ): TechnicalDetails => {
    let hookData: string | null = null;
    if (args.every((arg) => arg !== null)) {
      try {
        hookData = ethers.utils.defaultAbiCoder.encode(types, args);
      } catch {
        hookData = null;
      }
    }
    return { contractName, hookAddress, hookData, abiTypes: types };
  };

  const inspectorInput = form.auditor?.trim();
  const inspector = toAddress(
    inspectorInput
      ? getEffectiveAddress(inspectorInput, form.resolvedAuditor)
      : connectedAccount
  );
  const deadline = toSeconds(form.expirationDate);

  switch (module) {
    case "directSend":
    case "simpleCash":
      return encode(["string", "string"], [externalURI, imageURI]);

    case "cashBeforeDate":
      return encode(
        ["uint256", "string", "string"],
        [deadline, externalURI, imageURI]
      );

    case "reversibleRelease":
      return encode(
        ["address", "string", "string"],
        [inspector, externalURI, imageURI]
      );

    case "reversibleByBeforeDate":
      return encode(
        ["address", "uint256", "string", "string"],
        [inspector, toSeconds(form.inspectionEndDate), externalURI, imageURI]
      );

    case "cashBeforeDateDrip":
      return encode(
        ["uint256", "uint256", "uint256", "string", "string"],
        [
          deadline,
          toUnits(form.dripAmount, tokenDecimals),
          resolveDripPeriodSeconds({
            dripPeriodPreset: (form.dripPeriodPreset ??
              "weekly") as DripPeriodPreset,
            dripPeriodAmount: form.dripPeriodAmount ?? "1",
            dripPeriodUnit: (form.dripPeriodUnit ?? "hours") as DripPeriodUnit,
          }),
          externalURI,
          imageURI,
        ]
      );

    case "balanceOfConditionalCash":
      return encode(
        ["address", "uint8", "uint96", "uint256", "string", "string"],
        [
          toAddress(form.nftCollectionAddress),
          conditionTypeToEnum((form.conditionType as ConditionType) ?? "GTEQ"),
          deadline,
          toInteger(form.nftBalanceThreshold),
          externalURI,
          imageURI,
        ]
      );

    default:
      return null;
  }
}
