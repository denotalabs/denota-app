import { BigNumber, ethers } from "ethers";

export interface NotaInteraction {
  id: string;
  action: string;
  from: string | null;
  to: string | null;
  amount: string | null;
  timestamp: Date;
  txHash: string;
}

type FormatAmount = (wei: BigNumber | string) => string;

const accountId = (value: { id?: string } | string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  return value.id ?? null;
};

const txTimestamp = (transaction: { timestamp: string | number }): Date =>
  new Date(Number(transaction.timestamp) * 1000);

const pushInteraction = (
  interactions: NotaInteraction[],
  interaction: Omit<NotaInteraction, "id"> & { id?: string }
) => {
  interactions.push({
    id: interaction.id ?? `${interaction.txHash}-${interaction.action}-${interactions.length}`,
    action: interaction.action,
    from: interaction.from,
    to: interaction.to,
    amount: interaction.amount,
    timestamp: interaction.timestamp,
    txHash: interaction.txHash,
  });
};

/** Build a normalized interaction log from a subgraph nota entity. */
export const buildInteractionsFromSubgraph = (
  gqlNota: any,
  formatAmount: FormatAmount
): NotaInteraction[] => {
  const interactions: NotaInteraction[] = [];

  const written = gqlNota.written;
  if (written?.transaction) {
    const instant = BigNumber.from(written.instant ?? 0);
    const escrowed = BigNumber.from(written.escrowed ?? 0);
    pushInteraction(interactions, {
      action: "Written",
      from: accountId(written.caller),
      to: accountId(written.owner),
      amount: formatAmount(instant.add(escrowed)),
      timestamp: txTimestamp(written.transaction),
      txHash: written.transaction.hash,
    });
  }

  (gqlNota.funds ?? []).forEach((fund: any) => {
    if (!fund.transaction) {
      return;
    }
    const escrow = BigNumber.from(fund.escrow ?? 0);
    const instant = BigNumber.from(fund.instant ?? 0);
    pushInteraction(interactions, {
      action: "Funded",
      from: accountId(fund.caller),
      to: null,
      amount: formatAmount(escrow.add(instant)),
      timestamp: txTimestamp(fund.transaction),
      txHash: fund.transaction.hash,
    });
  });

  (gqlNota.transfers ?? []).forEach((transfer: any) => {
    if (!transfer.transaction) {
      return;
    }
    pushInteraction(interactions, {
      action: "Transferred",
      from: accountId(transfer.from),
      to: accountId(transfer.to),
      amount: null,
      timestamp: txTimestamp(transfer.transaction),
      txHash: transfer.transaction.hash,
    });
  });

  (gqlNota.cashes ?? []).forEach((cash: any) => {
    if (!cash.transaction) {
      return;
    }
    pushInteraction(interactions, {
      action: "Cashed",
      from: accountId(cash.caller),
      to: accountId(cash.to),
      amount: cash.escrow != null ? formatAmount(cash.escrow) : null,
      timestamp: txTimestamp(cash.transaction),
      txHash: cash.transaction.hash,
    });
  });

  (gqlNota.approvals ?? []).forEach((approval: any) => {
    if (!approval.transaction) {
      return;
    }
    pushInteraction(interactions, {
      action: "Approved",
      from: accountId(approval.owner),
      to: accountId(approval.approved),
      amount: null,
      timestamp: txTimestamp(approval.transaction),
      txHash: approval.transaction.hash,
    });
  });

  (gqlNota.approvedEvents ?? []).forEach((event: any) => {
    if (!event.transaction) {
      return;
    }
    pushInteraction(interactions, {
      action: "Approved",
      from: accountId(event.caller),
      to: accountId(gqlNota.approved),
      amount: null,
      timestamp: txTimestamp(event.transaction),
      txHash: event.transaction.hash,
    });
  });

  (gqlNota.burns ?? []).forEach((burn: any) => {
    if (!burn.transaction) {
      return;
    }
    pushInteraction(interactions, {
      action: "Burned",
      from: accountId(burn.caller),
      to: accountId(burn.to),
      amount: null,
      timestamp: txTimestamp(burn.transaction),
      txHash: burn.transaction.hash,
    });
  });

  (gqlNota.updates ?? []).forEach((update: any) => {
    if (!update.transaction) {
      return;
    }
    pushInteraction(interactions, {
      action: "Updated",
      from: accountId(update.caller),
      to: null,
      amount: null,
      timestamp: txTimestamp(update.transaction),
      txHash: update.transaction.hash,
    });
  });

  (gqlNota.metadataUpdates ?? []).forEach((update: any) => {
    if (!update.transaction) {
      return;
    }
    pushInteraction(interactions, {
      action: "Metadata updated",
      from: accountId(update.caller),
      to: null,
      amount: null,
      timestamp: txTimestamp(update.transaction),
      txHash: update.transaction.hash,
    });
  });

  return sortInteractions(interactions);
};

export const sortInteractions = (interactions: NotaInteraction[]): NotaInteraction[] =>
  [...interactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

/** Dedupe interactions that share the same tx hash and action. */
export const dedupeInteractions = (interactions: NotaInteraction[]): NotaInteraction[] => {
  const seen = new Set<string>();
  return interactions.filter((interaction) => {
    const key = `${interaction.txHash}:${interaction.action}:${interaction.from ?? ""}:${interaction.to ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const formatWeiAmount = (
  value: BigNumber | string,
  decimals: number,
  symbol: string
): string => {
  const formatted = ethers.utils.formatUnits(value, decimals);
  return symbol ? `${formatted} ${symbol}` : formatted;
};
