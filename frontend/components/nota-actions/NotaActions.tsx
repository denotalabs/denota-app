import { Tag, useToast, VStack } from "@chakra-ui/react";
import { useCallback, useState } from "react";
import { lookupEnsAddress } from "../../utils/ensClient";
import { isEnsName } from "../../utils/ensAddress";
import { useCashNotaAction } from "../../hooks/useCashNotaAction";
import { useFundNota } from "../../hooks/useFundNota";
import { useNotaActions } from "../../hooks/useNotaActions";
import { useTransferNota } from "../../hooks/useTransferNota";
import { NotaInfoData } from "../../hooks/useNotaInfo";
import {
  ActionFormValues,
  ResolvedAction,
} from "../../utils/notaActions/types";
import NotaActionBar from "./NotaActionBar";
import NotaActionPanel from "./NotaActionPanel";

interface Props {
  notaId: string;
  data: NotaInfoData;
  onRefresh: () => void;
}

function NotaActions({ notaId, data, onRefresh }: Props) {
  const [activeAction, setActiveAction] = useState<ResolvedAction | null>(null);
  const toast = useToast();

  const { context, role, actions, hookName, isLoading, isWalletConnected } =
    useNotaActions(notaId, data);

  const { cashNota } = useCashNotaAction(onRefresh);
  const { fundNota } = useFundNota(onRefresh);
  const { transferNota } = useTransferNota(onRefresh);

  const handleSubmit = useCallback(
    async (actionId: string, values: ActionFormValues) => {
      if (!context) {
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
    [cashNota, context, fundNota, toast, transferNota]
  );

  if (isLoading || !context) {
    return null;
  }

  return (
    <VStack align="stretch" spacing={3}>
      {isWalletConnected && (
        <Tag size="sm" alignSelf="flex-start" colorScheme="blue">
          Your role: {role}
          {hookName ? ` · ${hookName}` : ""}
        </Tag>
      )}
      <NotaActionBar
        actions={actions}
        onPick={setActiveAction}
        isWalletConnected={isWalletConnected}
      />
      {activeAction && (
        <NotaActionPanel
          action={activeAction}
          context={context}
          onClose={() => setActiveAction(null)}
          onSubmit={handleSubmit}
        />
      )}
    </VStack>
  );
}

export default NotaActions;
