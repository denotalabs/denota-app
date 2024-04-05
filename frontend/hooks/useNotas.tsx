import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import {
  getModuleData,
  Nota // Includes formatting and additional fields
} from "@denota-labs/denota-sdk";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useTokens } from "./useTokens";

interface Props {
  notaField: string;
}

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
  );

  const [optimisticNotas, setOptimisticNotas] = useState<Nota[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const addOptimisticNota = useCallback((nota: Nota) => {
    setOptimisticNotas((notas) => [...notas, nota]);
  }, []);

  const { getTokenUnits, currencyForTokenId } = useTokens();

  // Returns a filled out Nota object from a GraphQL response
  const mapField = useCallback(
    (gqlNota: any): Nota => {
      let totalAmountSent = BigNumber.from(gqlNota.written.instant).add(BigNumber.from(gqlNota.written.escrowed));
      const written = {
        instant: BigNumber.from(gqlNota.written.instant),
        escrowed: BigNumber.from(gqlNota.written.escrowed),
        timestamp: new Date(Number(gqlNota.written.transaction.timestamp) * 1000),
        moduleFee: BigNumber.from(gqlNota.written.moduleFee),
        writeBytes: gqlNota.written.writeBytes,
        transaction: {
          timestamp: new Date(Number(gqlNota.written.transaction.timestamp) * 1000),
          hash: gqlNota.written.transaction.hash,
          blockNumber: gqlNota.written.transaction.blockNumber,
        }
      };
      const funds = gqlNota.funds.map((fund: any) => {
        return {
          amount: BigNumber.from(fund.amount),
          timestamp: new Date(Number(fund.transaction.timestamp) * 1000),
        }
      });
      const cashes = gqlNota.cashes.map((cash: any) => {
        return {
          to: cash.to,
          amount: BigNumber.from(cash.amount),
          timestamp: new Date(Number(cash.transaction.timestamp) * 1000),
          transaction: {
            timestamp: new Date(Number(cash.transaction.timestamp) * 1000),
            hash: cash.transaction.hash,
            blockNumber: cash.transaction.blockNumber,
          }
        }
      });

      let nota: Nota = {
        id: gqlNota.id as string,
        token: gqlNota.token.id,
        escrowed: BigNumber.from(gqlNota.escrowed),
        module: gqlNota.module.id as string,
        moduleData: gqlNota.moduleData,  // Only has writeBytes

        owner: gqlNota.owner.id as string,
        approved: gqlNota.approved?.id as string,
        sender: gqlNota.sender.id as string,
        receiver: gqlNota.receiver.id as string,
        totalAmountSent: totalAmountSent,
        createdAt: new Date(Number(gqlNota.written.transaction.timestamp) * 1000),

        written: written,
        transfers: gqlNota.transfers,
        funds: funds,
        cashes: cashes,
        approvals: gqlNota.approvals,
        metadataUpdates: gqlNota.metadataUpdates,
      };

      nota.moduleData = getModuleData({ account: account, chainIdNumber: chainId, nota: nota, hookAddress: nota.module });
      return nota;
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
      token {
        id
      }
      escrowed
      module {
        id
      }
      moduleData {
        writeBytes
      }
      owner {
        id
      }
      approved {
        id
      }
      sender {
        id
      }
      receiver {
        id
      }
      written {
        instant
        escrowed
        moduleFee
        writeBytes
        transaction {
          timestamp
          hash
        }
      }
      transfers {
        transaction {
          timestamp
        }
      }
      funds {
        amount
        transaction {
          timestamp
        }
      }
      cashes {
        to
        amount
        transaction {
          timestamp
        }
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
        nota.sender === account
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
        const displayNotas = notasReceivedIncludingOptimistic
          .concat(notasSentIncludingOptimistic)
          .filter((nota, index, self) => {
            return self.findIndex((n) => n.id === nota.id) === index;
          })
          .sort((a, b) => {
            return (
              b.createdAt.getTime() - a.createdAt.getTime()
            );
          });
        return displayNotas;
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
