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
  createdTransaction: NotaTransaction;
  fundedTransaction: NotaTransaction | null;
  isPayer: boolean;
  uri: string;
  payer: string;
  payee: string;
  moduleData: EscrowModuleData | DirectPayModuleData;
  inspector?: string;
  isInspector: boolean;
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
  );
  const [optimisticNotas, setOptimisticNotas] = useState<Nota[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const addOptimisticNota = useCallback((nota: Nota) => {
    setOptimisticNotas((notas) => [...notas, nota]);
  }, []);

  const currencyForTokenId = useCallback(
    (tokenAddress: string): NotaCurrency => {
      const mapping = contractMappingForChainId(blockchainState.chhainIdNumber);

      switch (tokenAddress) {
        case mapping.dai.toLowerCase():
          return "DAI";
        case mapping.weth.toLowerCase():
          return "WETH";
        case mapping.usdc.toLocaleLowerCase():
          return "USDC";
        default:
          return "UNKNOWN";
      }
    },
    [blockchainState.chhainIdNumber]
  );

  const { getTokenUnits } = useTokens();

  const mapField = useCallback(
    (gqlNota: any) => {
      const createdTx = gqlNota.createdTransaction.id;

      const isPayer =
        gqlNota.sender.id === blockchainState.account.toLowerCase();

      // TODO: module data
      let isInspector = false;

      let moduleData: EscrowModuleData | DirectPayModuleData;

      const isEscrow =
        gqlNota.module.id === blockchainState.escrowAddress.toLowerCase();

      if (isEscrow) {
        isInspector = isPayer;
        let status: "released" | "awaiting_release" | "releasable";

        if (gqlNota.cashes.length > 0) {
          status = "released";
        } else if (isPayer) {
          // TODO: this assumes self signed, update to pull the actual inspector
          status = "releasable";
        } else {
          status = "awaiting_release";
        }

        moduleData = {
          module: "escrow",
          status,
        };
      } else {
        moduleData = { module: "direct", status: "paid" };
      }

      const amount = isEscrow
        ? gqlNota.written.escrowed
        : gqlNota.written.instant;

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
      blockchainState.escrowAddress,
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
          console.log({ data });
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
