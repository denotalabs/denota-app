import { Box, Heading, useToast, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { notaInfoTheme as t } from "../designSystem/notaInfoTheme";
import { lookupEnsAddress } from "../../utils/ensClient";
import { isEnsName } from "../../utils/ensAddress";
import { useCashNotaAction } from "../../hooks/useCashNotaAction";
import { useFundNota } from "../../hooks/useFundNota";
import { useNotaActions } from "../../hooks/useNotaActions";
import { useTransferNota } from "../../hooks/useTransferNota";
import { NotaInfoData } from "../../hooks/useNotaInfo";
import {
  ActionFormValues,
  NotaRole,
  ResolvedAction,
} from "../../utils/notaActions/types";
import NotaActionBar from "./NotaActionBar";
import NotaActionPanel from "./NotaActionPanel";
import NotaRolePreview from "./NotaRolePreview";

interface Props {
  notaId: string;
  data: NotaInfoData;
  onRefresh: () => void;
}

function NotaActions({ notaId, data, onRefresh }: Props) {
  const [activeAction, setActiveAction] = useState<ResolvedAction | null>(null);
  const [previewRole, setPreviewRole] = useState<NotaRole | null>(null);
  const toast = useToast();

  const {
    context,
    walletRole,
    actions,
    isLoading,
    isWalletConnected,
    canExecute,
    isPreviewing,
  } = useNotaActions(notaId, data, previewRole ?? undefined);

  const prevWalletRole = useRef(walletRole);

  useEffect(() => {
    if (previewRole === null && !isLoading && context) {
      setPreviewRole(walletRole);
    }
  }, [context, isLoading, previewRole, walletRole]);

  useEffect(() => {
    if (previewRole === prevWalletRole.current) {
      setPreviewRole(walletRole);
    }
    prevWalletRole.current = walletRole;
  }, [previewRole, walletRole]);

  useEffect(() => {
    setActiveAction(null);
  }, [previewRole]);

  const { cashNota } = useCashNotaAction(onRefresh);
  const { fundNota } = useFundNota(onRefresh);
  const { transferNota } = useTransferNota(onRefresh);

  const handleSubmit = useCallback(
    async (actionId: string, values: ActionFormValues) => {
      if (!context || !canExecute) {
        return;
      }

      try {
        switch (actionId) {
          case "cash":
            if (!values.escrow || !values.to) {
              throw new Error("Amount and destination are required");
            }
            await cashNota(context, {
              escrow: values.escrow,
              to: values.to,
            });
            break;
          case "fund":
            await fundNota(context, {
              escrow: values.escrow ?? "0",
              instant: values.instant ?? "0",
            });
            break;
          case "transfer": {
            let resolvedTo: string | undefined;
            if (values.to && isEnsName(values.to)) {
              resolvedTo = (await lookupEnsAddress(values.to)) ?? undefined;
            }
            if (!values.to) {
              throw new Error("Recipient address is required");
            }
            await transferNota(context, {
              to: values.to,
              resolvedTo,
            });
            break;
          }
          default:
            throw new Error(`Action ${actionId} is not yet supported`);
        }
      } catch (error) {
        console.error(error);
        toast({
          title:
            error instanceof Error ? error.message : "Transaction failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        throw error;
      }
    },
    [canExecute, cashNota, context, fundNota, toast, transferNota]
  );

  if (isLoading || !context || previewRole === null) {
    return null;
  }

  return (
    <VStack align="stretch" spacing={0}>
      <Heading
        as="h3"
        fontSize="sm"
        fontWeight={500}
        color={t.textBright}
        mb="11px"
      >
        Your actions
      </Heading>
      <Box>
        <NotaRolePreview
          context={context}
          previewRole={previewRole}
          walletRole={walletRole}
          isWalletConnected={isWalletConnected}
          onPreviewRoleChange={setPreviewRole}
        />
        <NotaActionBar
          actions={actions}
          onPick={setActiveAction}
          isWalletConnected={isWalletConnected}
          isPreviewing={isPreviewing}
          previewRole={previewRole}
        />
      </Box>
      {activeAction && (
        <NotaActionPanel
          action={activeAction}
          context={context}
          canExecute={canExecute}
          isPreviewing={isPreviewing}
          onClose={() => setActiveAction(null)}
          onSubmit={handleSubmit}
        />
      )}
    </VStack>
  );
}

export default NotaActions;
