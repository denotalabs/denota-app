import { ModuleData } from "@denota-labs/denota-sdk";
import { useMemo } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { deriveNotaRole } from "../utils/notaActions/deriveRole";
import { hookDisplayName } from "../utils/notaActions/hookRegistry";
import {
  extractInspectorFromMetadata,
  extractPayerFromMetadata,
} from "../utils/notaActions/metadataRoles";
import { buildModuleDataFromTokenUri } from "../utils/notaActions/moduleDataFromTokenUri";
import { resolveActions } from "../utils/notaActions/resolveActions";
import { NotaActionContext } from "../utils/notaActions/types";
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

export function useNotaActions(notaId: string, data: NotaInfoData) {
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

  const role = useMemo(
    () =>
      deriveNotaRole(account, {
        owner: context?.owner ?? null,
        approved: context?.approved ?? null,
        sender: context?.sender ?? null,
        inspector: context?.inspector ?? null,
      }),
    [account, context]
  );

  const actions = useMemo(
    () => (context ? resolveActions(role, context) : []),
    [context, role]
  );

  const hookName = useMemo(
    () => (context ? hookDisplayName(context.hook) : null),
    [context]
  );

  return {
    context,
    role,
    actions,
    hookName,
    isLoading,
    isWalletConnected: !!account,
  };
}
