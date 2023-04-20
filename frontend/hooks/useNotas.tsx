import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import {
  chainInfoForChainId,
  chainNumberToChainHex,
} from "../context/chainInfo";

interface Props {
  notaField: string;
}

export interface NotaDates {
  created: Date;
}

export interface NotaTransaction {
  date: Date;
  hash: string;
}

export type DirectPayStatus = "paid" | "awaiting_payment" | "payable";

export type EscrowStatus =
  | "voided"
  | "released"
  | "awaiting_release"
  | "releasable"
  | "awaiting_escrow"
  | "payable";

export interface EscrowModuleData {
  status: EscrowStatus;
  isSelfSigned: boolean;
  module: "escrow";
}

export interface DirectPayModuleData {
  status: DirectPayStatus;
  module: "direct";
}

export interface Nota {
  id: string;
  amount: number;
  amountRaw: BigNumber;
  sender: string;
  receiver: string;
  owner: string;
  token: NotaCurrency;
  isInvoice: boolean;
  createdTransaction: NotaTransaction;
  fundedTransaction: NotaTransaction | null;
  isPayer: boolean;
  uri: string;
  payer: string;
  payee: string;
  dueDate?: Date;
  moduleData: EscrowModuleData | DirectPayModuleData;
  inspector?: string;
  isInspector: boolean;
  isCrossChain: boolean;
  sourceChainName?: string;
  sourceChainHex?: string;
  destChain?: string;
}

const convertExponent = (amountExact: number) => {
  // Use right exponent
  return Number(BigInt(amountExact) / BigInt(10 ** 16)) / 100;
};

export const useNotas = ({ notaField }: Props) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const [notasReceived, setNotasReceived] = useState<Nota[] | undefined>(
    undefined
  );
  const [notasSent, setNotaSent] = useState<Nota[] | undefined>(undefined);
  const [notasInspected, setNotasInspected] = useState<Nota[] | undefined>(
    undefined
  );
  const [optimisticNotas, setOptimisticNotas] = useState<Nota[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const addOptimisticNota = useCallback((nota: Nota) => {
    setOptimisticNotas((notas) => [...notas, nota]);
  }, []);

  const currencyForTokenId = useCallback(
    (tokenAddress: string): NotaCurrency => {
      switch (tokenAddress) {
        case blockchainState.dai?.address.toLowerCase():
          return "DAI";
        case blockchainState.weth?.address.toLowerCase():
          return "WETH";
        default:
          return "NATIVE";
      }
    },
    [blockchainState.dai?.address, blockchainState.weth?.address]
  );

  const mapField = useCallback(
    (gqlNota: any) => {
      const createdTx = gqlNota.createdTransaction.id;

      const isInvoice = gqlNota.moduleData.isInvoice;

      const fundedDate = gqlNota.moduleData.fundedTimestamp
        ? new Date(Number(gqlNota.moduleData.fundedTimestamp) * 1000)
        : null;

      const fundedTx = gqlNota.moduleData.fundedTransaction
        ? gqlNota.moduleData.fundedTransaction.id
        : null;

      const payer = isInvoice
        ? (gqlNota.receiver.id as string)
        : (gqlNota.sender.id as string);

      const payee = isInvoice
        ? (gqlNota.sender.id as string)
        : (gqlNota.receiver.id as string);

      const isPayer = payer === blockchainState.account.toLowerCase();

      const isInspector =
        gqlNota.inspector?.id === blockchainState.account.toLowerCase();

      let dueDate: Date | undefined = undefined;

      if (gqlNota.moduleData.dueDate) {
        dueDate = new Date(Number(gqlNota.moduleData.dueDate) * 1000);
      }

      let moduleData: EscrowModuleData | DirectPayModuleData;

      if (gqlNota.moduleData.__typename === "DirectPayData") {
        const status = gqlNota.moduleData.status;
        let viewerStatus: DirectPayStatus = "awaiting_payment";
        if (status === "AWAITING_PAYMENT") {
          if (isPayer) {
            viewerStatus = "payable";
          } else {
            viewerStatus = "awaiting_payment";
          }
        } else {
          viewerStatus = "paid";
        }
        moduleData = { module: "direct", status: viewerStatus };
      } else if (gqlNota.moduleData.__typename === "ReversiblePaymentData") {
        const status = gqlNota.moduleData.status;
        let viewerStatus: EscrowStatus = "awaiting_escrow";
        switch (status) {
          case "AWAITING_ESCROW":
            if (isPayer) {
              viewerStatus = "payable";
            } else {
              viewerStatus = "awaiting_escrow";
            }
            break;
          case "AWAITING_RELEASE":
            if (isInspector) {
              viewerStatus = "releasable";
            } else {
              viewerStatus = "awaiting_release";
            }
            break;
          case "RELEASED":
            viewerStatus = "released";
            break;
          case "VOIDED":
            viewerStatus = "voided";
        }
        moduleData = {
          module: "escrow",
          status: viewerStatus,
          isSelfSigned: gqlNota.moduleData.isSelfSigned,
        };
      }

      const sourceChainHex = gqlNota.moduleData.sourceChain
        ? chainNumberToChainHex(Number(gqlNota.moduleData.sourceChain))
        : undefined;

      const sourceChainName = gqlNota.moduleData.sourceChain
        ? chainInfoForChainId(Number(gqlNota.moduleData.sourceChain))
            .displayName
        : undefined;

      const destChain = gqlNota.moduleData.sourceChain
        ? chainInfoForChainId(Number(gqlNota.moduleData.destChain)).displayName
        : undefined;

      return {
        id: gqlNota.id as string,
        amount: convertExponent(gqlNota.moduleData.amount as number),
        amountRaw: BigNumber.from(gqlNota.moduleData.amount),
        token: currencyForTokenId(gqlNota.erc20.id),
        receiver: gqlNota.receiver.id as string,
        sender: gqlNota.sender.id as string,
        owner: gqlNota.owner.id as string,
        createdTransaction: {
          date: new Date(Number(gqlNota.timestamp) * 1000),
          hash: createdTx,
        },
        fundedTransaction:
          fundedDate && fundedTx
            ? {
                date: fundedDate,
                hash: fundedTx,
              }
            : null,
        isInvoice,
        uri: gqlNota.uri,
        isPayer,
        payer,
        payee,
        dueDate,
        moduleData,
        inspector: gqlNota.inspector
          ? (gqlNota.inspector?.id as string)
          : undefined,
        isInspector,
        isCrossChain: gqlNota.moduleData.isCrossChain,
        sourceChainName,
        destChain,
        sourceChainHex,
      };
    },
    [blockchainState.account, currencyForTokenId]
  );

  const refresh = useCallback(() => {
    if (account) {
      setIsLoading(true);
      const tokenFields = `      
      id
      escrowed
      timestamp
      uri
      createdTransaction {
        id
      }
      sender {
        id
      }
      receiver {
        id
      }
      owner {
        id
      }
      erc20 {
        id
      }
      inspector {
        id
      }
      moduleData {
        ... on DirectPayData {
          __typename
          status
          amount
          fundedTimestamp
          isInvoice
          isCrossChain
          sourceChain
          destChain
          fundedTransaction {
            id
          }
          creditor {
            id
          }
          debtor {
            id
          }
          dueDate
        }
        ... on ReversiblePaymentData {
          __typename
          status
          amount
          fundedTimestamp
          isInvoice
          fundedTransaction {
            id
          }
          isSelfSigned
          creditor {
            id
          }
          debtor {
            id
          }
        }
      }
      `;

      // TODO: pagination
      // TODO: remove references to cheq from the graph schema
      const tokenQuery = gql`
      query accounts($account: String ){
        account(id: $account)  {
          cheqsSent(orderBy: createdAt, orderDirection: desc) {
            ${tokenFields}
          }
          cheqsReceived(orderBy: createdAt, orderDirection: desc) {
            ${tokenFields}
          }
          cheqsInspected(orderBy: createdAt, orderDirection: desc) {
            ${tokenFields}
          }
       }
      }
      `;

      const client = new ApolloClient({
        uri: blockchainState.graphUrl,
        cache: new InMemoryCache(),
      });
      client
        .query({
          query: tokenQuery,
          variables: {
            account: account.toLowerCase(),
          },
        })
        .then((data) => {
          console.log({ data });
          if (data["data"]["account"]) {
            const gqlNotasSent = data["data"]["account"]["cheqsSent"] as any[];
            const gqlNotasReceived = data["data"]["account"][
              "cheqsReceived"
            ] as any[];
            const gqlNotasInspected = data["data"]["account"][
              "cheqsInspected"
            ] as any[];
            setNotaSent(gqlNotasSent.map(mapField));
            setNotasReceived(gqlNotasReceived.map(mapField));
            setNotasInspected(gqlNotasInspected.map(mapField));
          } else {
            setNotaSent([]);
            setNotasReceived([]);
            setNotasInspected([]);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
          setIsLoading(false);
        });
    }
  }, [account, blockchainState.graphUrl, mapField]);

  useEffect(() => {
    refresh();
  }, [refresh, account]);

  const notasSentIncludingOptimistic = useMemo(() => {
    if (notasSent === undefined) {
      return undefined;
    }

    const sentNotaIds = notasSent.reduce((prev, nota) => {
      return [...prev, nota.id];
    }, []);
    const optimisticNotasFiltered = optimisticNotas.filter(
      (nota) =>
        !sentNotaIds.includes(nota.id) &&
        nota.sender === blockchainState.account
    );
    return optimisticNotasFiltered.concat(notasSent);
  }, [blockchainState.account, notasSent, optimisticNotas]);

  const notasReceivedIncludingOptimistic = useMemo(() => {
    if (notasReceived === undefined) {
      return undefined;
    }

    const receivedNotaIds = notasReceived.reduce((prev, nota) => {
      return [...prev, nota.id];
    }, []);
    const optimisticNotasFiltered = optimisticNotas.filter(
      (nota) =>
        !receivedNotaIds.includes(nota.id) &&
        nota.sender === blockchainState.account
    );
    return optimisticNotasFiltered.concat(notasReceived);
  }, [blockchainState.account, notasReceived, optimisticNotas]);

  const notas = useMemo(() => {
    if (
      notasReceived === undefined ||
      notasSent === undefined ||
      notasInspected === undefined ||
      isLoading
    ) {
      return undefined;
    }
    const nonSelfSigned = notasInspected.filter(
      (nota: Nota) =>
        nota.moduleData.module === "escrow" && !nota.moduleData.isSelfSigned
    );
    switch (notaField) {
      case "cheqsSent":
        return notasSentIncludingOptimistic;
      case "cheqsReceived":
        return notasReceivedIncludingOptimistic;
      default:
        return notasReceivedIncludingOptimistic
          .concat(notasSentIncludingOptimistic)
          .concat(nonSelfSigned)
          .sort((a, b) => {
            return (
              b.createdTransaction.date.getTime() -
              a.createdTransaction.date.getTime()
            );
          });
    }
  }, [
    notasReceived,
    notasSent,
    notasInspected,
    isLoading,
    notaField,
    notasSentIncludingOptimistic,
    notasReceivedIncludingOptimistic,
  ]);

  return { notas, refresh, addOptimisticNota };
};
