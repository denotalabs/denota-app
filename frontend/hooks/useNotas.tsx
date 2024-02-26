import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { contractMappingForChainId } from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useTokens } from "./useTokens";

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

export type DirectPayStatus = "paid";

export type SimpleCashStatus = "claimable" | "awaiting_claim" | "claimed";

export type CashBeforeDateStatus =
  | "claimable"
  | "claimed"
  | "expired"
  | "revoked";

export type ReversibleReleaseStatus =
  | "releasable"
  | "awaiting_release"
  | "revoked"
  | "released";

export type ReversibleByBeforeDateStatus =
  | "releasable"
  | "awaiting_release"
  | "released"
  | "revoked"
  | "claimable"
  | "claimed";

export interface DirectPayModuleData {
  status: DirectPayStatus;
  module: "direct";
}

export interface SimpleCashModuleData {
  status: SimpleCashStatus;
  module: "simpleCash";
}

export interface CashBeforeDateModuleData {
  status: CashBeforeDateStatus;
  module: "cashBeforeDate";
}

export interface ReversibleReleaseModuleData {
  status: ReversibleReleaseStatus;
  module: "reversibleRelease";
}

export interface ReversibleByBeforeDateModuleData {
  status: ReversibleByBeforeDateStatus;
  module: "reversibleByBeforeDate";
}

export interface Nota {
  id: string;
  amount: number;
  amountRaw: BigNumber;
  sender: string; // TODO: remove
  receiver: string; // TODO: remove
  owner: string;
  token: NotaCurrency;
  createdTransaction: NotaTransaction;
  fundedTransaction: NotaTransaction | null; // TODO have list of WTFCA transactions
  isPayer: boolean; // TODO: remove
  uri: string;
  payer: string;
  payee: string;
  inspector?: string; // TODO: remove since should be in moduleData
  isInspector: boolean; // TODO: remove since should be in moduleData
  moduleData:
  | DirectPayModuleData
  | SimpleCashModuleData
  | CashBeforeDateModuleData
  | ReversibleReleaseModuleData
  | ReversibleByBeforeDateModuleData;
}

const convertExponent = (amountExact: number, exponent: number) => {
  const adjustedExponent = exponent - 3;
  return Number(BigInt(amountExact) / BigInt(10 ** adjustedExponent)) / 1000;
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
  ); // TODO: should be injected by module

  const [optimisticNotas, setOptimisticNotas] = useState<Nota[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const addOptimisticNota = useCallback((nota: Nota) => {
    setOptimisticNotas((notas) => [...notas, nota]);
  }, []);

  const { getTokenUnits, currencyForTokenId } = useTokens();

  const mapField = useCallback(
    (gqlNota: any) => {
      const createdTx = gqlNota.createdTransaction.id;

      const isPayer =
        gqlNota.sender.id === blockchainState.account.toLowerCase();

      let isInspector = false; // TODO: expect inside module data

      let moduleData:
        | DirectPayModuleData
        | SimpleCashModuleData
        | CashBeforeDateModuleData
        | ReversibleReleaseModuleData
        | ReversibleByBeforeDateModuleData;

      let status: "paid" | "claimable" | "awaiting_claim" | "awaiting_release" | "releasable" | "released" | "claimed" | "expired" | "revoked";

      const mapping = contractMappingForChainId(blockchainState.chhainIdNumber);

      switch (gqlNota.module.id) {
        case mapping.simpleCash.toLowerCase():
          if (gqlNota.cashes.length > 0) {
            status = "claimed";
          } else if (gqlNota.owner.id === blockchainState.account.toLowerCase()) {
            status = "claimable";
          } else {
            status = "awaiting_claim";
          }
          moduleData = {
            module: "simpleCash",
            status,
          };
          break;
        case mapping.cashBeforeDate.toLowerCase():
          // if (gqlNota.owner.id === blockchainState.account.toLowerCase()) {
          //   // If owner, can be claimable, or expired, or revoked
          //   // If sender, can be awaiting_claim, revokable, or revoked
          //   status = "claimable";
          // } else if (gqlNota.cashBeforeDate >= Date.now()) {
          //   status = "awaiting_claim";
          // }

          // TODO need to have cashBeforeDate in this object. AKA need have it in the subgraph
          if (gqlNota.cashes.length > 0) {
            // TODO can either be revoked or claimed, need to store that in the subgraph
            if (true) {  // Look inside cashes to see if it's revoked
              status = "claimed";
            } else {
            }
          } else if (gqlNota.cashBeforeDate >= Date.now()) {
            status = "awaiting_claim";
          } else if (gqlNota.cashBeforeDate < Date.now()) {
            status = "expired";
          } else {
            status = "claimable";
          }

          moduleData = {
            module: "cashBeforeDate",
            status,
          };
          break;
        case mapping.reversibleRelease.toLowerCase():
          isInspector = isPayer; // TODO

          if (gqlNota.cashes.length > 0) {
            // TODO: handle voided state
            status = "released";
          } else if (isPayer) {
            // TODO: this assumes self signed, update to pull the actual inspector
            status = "releasable";
          } else {
            status = "awaiting_release";
          }

          moduleData = {
            module: "reversibleRelease",
            status,
          };
          break;
        // TODO add to sdk with new module/reversibleByBeforeDate.ts
        // case mapping.reversibleByBeforeDate.toLowerCase():
        //   isInspector = isPayer;  // TODO

        //   if (gqlNota.cashes.length > 0) {
        //     // TODO: handle voided state
        //     status = "released";
        //   } else if (isPayer) {
        //     // TODO: this assumes self signed, update to pull the actual inspector
        //     status = "releasable";
        //   } else {
        //     status = "awaiting_release";
        //   }

        //   moduleData = {
        //     module: "reversibleRelease",
        //     status,
        //   };
        //   break;
        default: // Assumes direct pay if module is unknown
          moduleData = { module: "direct", status: "paid" };
      }

      const amount =
        moduleData.module === "direct"
          ? gqlNota.written.instant
          : gqlNota.written.escrowed;

      return {
        id: gqlNota.id as string,
        amount: convertExponent(
          Number(amount),
          getTokenUnits(currencyForTokenId(gqlNota.currency.id))
        ),
        amountRaw: BigNumber.from(amount),
        token: currencyForTokenId(gqlNota.currency.id),
        receiver: gqlNota.receiver.id as string,
        sender: gqlNota.sender.id as string,
        owner: gqlNota.owner.id as string,
        createdTransaction: {
          date: new Date(Number(gqlNota.createdTransaction.timestamp) * 1000),
          hash: createdTx,
        },
        fundedTransaction: null, // TODO: calculate based on escrow
        uri: gqlNota.uri,
        isPayer,
        payer: gqlNota.sender.id as string,
        payee: gqlNota.receiver.id as string,
        moduleData,
        inspector: undefined,
        isInspector,
      };
    },
    [
      blockchainState.account,
      blockchainState.chhainIdNumber,
      currencyForTokenId,
      getTokenUnits,
    ]
  );

  const refresh = useCallback(() => {
    if (account) {
      setIsLoading(true);
      const tokenFields = `      
      id
      escrowed
      uri
      createdTransaction {
        timestamp
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
      currency {
        id
      }
      module {
        id
      }
      cashes {
        id
      }
      written {
        instant
        escrowed
      }
      `;

      // TODO: pagination
      // TODO: remove references to nota from the graph schema
      const tokenQuery = gql`
      query accounts($account: String ){
        account(id: $account)  {
          notasSent {
            ${tokenFields}
          }
          notasReceived {
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
          if (data["data"]["account"]) {
            const gqlNotasSent = data["data"]["account"]["notasSent"] as any[];
            const gqlNotasReceived = data["data"]["account"][
              "notasReceived"
            ] as any[];
            setNotaSent(
              gqlNotasSent.filter((nota) => nota.owner).map(mapField)
            );
            setNotasReceived(
              gqlNotasReceived.filter((nota) => nota.owner).map(mapField)
            );
            setNotasInspected([]);
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
          setNotaSent([]);
          setNotasReceived([]);
          setNotasInspected([]);
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
        nota.receiver === blockchainState.account
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
    switch (notaField) {
      case "notasSent":
        return notasSentIncludingOptimistic;
      case "notasReceived":
        return notasReceivedIncludingOptimistic;
      default:
        return notasReceivedIncludingOptimistic
          .concat(notasSentIncludingOptimistic)
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
