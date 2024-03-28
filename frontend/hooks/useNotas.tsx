import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { getModuleData, ModuleData, NotaTransaction } from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useTokens } from "./useTokens";

interface Props {
  notaField: string;
}

//////////// TODO need to set and pull the above from the SDK ////////////
export interface Nota {
  id: string;
  token: NotaCurrency;
  amount: number;
  amountRaw: BigNumber;
  moduleData: ModuleData;
  sender: string;  // TODO: remove
  receiver: string;  // TODO: remove
  owner: string;
  createdTransaction: NotaTransaction;
  fundedTransaction: NotaTransaction | null;  // TODO have list of WTFCA transactions
  isPayer: boolean;  // TODO: remove but is passed to NotasContext
  payer: string;
  payee: string;
  isInspector: boolean;  // TODO: remove since should be in moduleData
  uri: string;
  inspector?: string;  // TODO: remove since should be in moduleData
}
//////////// TODO need to set and pull the above from the SDK ////////////

const convertExponent = (amountExact: number, exponent: number) => {
  const adjustedExponent = exponent - 3;
  return Number(BigInt(amountExact) / BigInt(10 ** adjustedExponent)) / 1000;
};

export const useNotas = ({ notaField }: Props) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account.toLowerCase();
  const chainId = Number(blockchainState.chainId);

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

      const isPayer = gqlNota.sender.id === account;

      let isInspector = false; // TODO: expect inside module data

      // TODO should gqlNota be converted to a Nota type first?
      let moduleData = getModuleData(account, chainId, gqlNota, gqlNota.module.id.toLowerCase());

      const amount = moduleData.moduleName === "directSend"
        ? gqlNota.written.instant
        : gqlNota.written.escrowed;

      return {
        id: gqlNota.id as string,
        token: currencyForTokenId(gqlNota.currency.id),
        amount: convertExponent(
          Number(amount),
          getTokenUnits(currencyForTokenId(gqlNota.currency.id))
        ),
        amountRaw: BigNumber.from(amount),
        moduleData,
        // TODO keep sender/receiver OR payer/payee? Both?
        sender: gqlNota.sender.id as string,
        receiver: gqlNota.receiver.id as string,
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
        inspector: undefined,
        isInspector,
      };
    },
    [
      account,
      blockchainState.chhainIdNumber,
      currencyForTokenId,
      getTokenUnits,
    ]
  );

  const refresh = useCallback(() => {
    if (account) {
      setIsLoading(true);
      const notaFields = `      
      id
      currency {
        id
      }
      escrowed
      module {
        id
      }
      moduleData {
        raw
      }
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
      cashes {
        to
        transaction {
          timestamp
        }
      }
      transfers {
        transaction {
          timestamp
        }
      }
      written {
        instant
        escrowed
      }
      `;

      // TODO: pagination
      const tokenQuery = gql`
      query accounts($account: String ){
        account(id: $account)  {
          notasSent {
            ${notaFields}
          }
          notasReceived {
            ${notaFields}
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
            account: account,
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
        nota.payer === account
    );

    return optimisticNotasFiltered.concat(notasSent);
  }, [account, notasSent, optimisticNotas]);

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
        nota.owner === account
    );
    // TODO need to filter duplicate notas (sent and received)
    return optimisticNotasFiltered.concat(notasReceived);
  }, [account, notasReceived, optimisticNotas]);

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
