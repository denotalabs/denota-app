import { ModuleData } from "@denota-labs/denota-sdk";
import { useMemo } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { deriveNotaRole } from "../utils/notaActions/deriveRole";
import {
  extractInspectorFromMetadata,
  extractPayerFromMetadata,
} from "../utils/notaActions/metadataRoles";
import { buildModuleDataFromTokenUri } from "../utils/notaActions/moduleDataFromTokenUri";
import { buildContextForRole } from "../utils/notaActions/rolePreview";
import { resolveActions } from "../utils/notaActions/resolveActions";
import { NotaActionContext, NotaRole } from "../utils/notaActions/types";
import { NotaInfoData } from "./useNotaInfo";

const UNKNOWN_MODULE_DATA: ModuleData = {
  moduleName: "unknown",
  status: "?",
  writeBytes: "",
  externalURI: "",
  imageURI: "",
};

function resolveModuleData(
  data: NotaInfoData,
  account: string,
  chainIdNumber: number
): ModuleData {
  const owner = data.owner!.toLowerCase();
  const hook = data.onChainState!.hook;
  const escrowWei = data.onChainState!.escrowWei;

  return (
    buildModuleDataFromTokenUri({
      hookAddress: hook,
      chainIdNumber,
      metadata: data.metadata,
      escrowWei,
      owner,
      account,
    }) ?? UNKNOWN_MODULE_DATA
  );
}

export function useNotaActions(
  notaId: string,
  data: NotaInfoData,
  previewRole?: NotaRole
) {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const chainIdNumber = blockchainState.chainIdNumber;

  const isLoading =
    data.ownerLoading || data.onChainStateLoading || data.metadataLoading;

  const context = useMemo((): NotaActionContext | null => {
    if (!data.owner || !data.onChainState || data.notFound) {
      return null;
    }

    const payer = extractPayerFromMetadata(data.metadata);
    const moduleData = resolveModuleData(
      data,
      account || "",
      chainIdNumber
    );
    const inspector =
      extractInspectorFromMetadata(data.metadata) ??
      ("inspector" in moduleData &&
      typeof moduleData.inspector === "string" &&
      moduleData.inspector
        ? moduleData.inspector.toLowerCase()
        : null);

    return {
      id: notaId,
      owner: data.owner.toLowerCase(),
      approved: data.approved?.toLowerCase() ?? null,
      sender: payer,
      receiver: data.owner.toLowerCase(),
      escrow: data.onChainState.escrow,
      escrowWei: data.onChainState.escrowWei,
      currency: data.onChainState.currency,
      currencySymbol: data.onChainState.currencySymbol,
      hook: data.onChainState.hook,
      moduleData,
      inspector,
    };
  }, [account, chainIdNumber, data, notaId]);

  const walletRole = useMemo(
    () =>
      deriveNotaRole(account, {
        owner: context?.owner ?? null,
        approved: context?.approved ?? null,
        sender: context?.sender ?? null,
        inspector: context?.inspector ?? null,
      }),
    [account, context]
  );

  const effectiveRole = previewRole ?? walletRole;

  const displayContext = useMemo(() => {
    if (!context) {
      return null;
    }
    if (!previewRole || previewRole === walletRole) {
      return context;
    }
    return buildContextForRole(context, previewRole, {
      metadata: data.metadata,
      chainIdNumber,
    });
  }, [chainIdNumber, context, data.metadata, previewRole, walletRole]);

  const actions = useMemo(
    () =>
      displayContext ? resolveActions(effectiveRole, displayContext) : [],
    [displayContext, effectiveRole]
  );

  const canExecute = !!account && effectiveRole === walletRole;
  const isPreviewing = effectiveRole !== walletRole;

  return {
    context: displayContext,
    walletRole,
    previewRole: effectiveRole,
    actions,
    isLoading,
    isWalletConnected: !!account,
    canExecute,
    isPreviewing,
  };
}
