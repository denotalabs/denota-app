import { useCallback, useEffect, useMemo, useState } from "react";

import { BigNumber } from "ethers";

import { ApolloClient, gql, InMemoryCache } from "@apollo/client";

import { CheqCurrency } from "../components/designSystem/CurrencyIcon";
import { APIURL, useBlockchainData } from "../context/BlockchainDataProvider";

interface Props {
  cheqField: string;
}

export interface CheqTransactions {
  created: string | null;
  funded: string | null;
  cashed: string | null;
}

export interface Cheq {
  id: string;
  amount: number;
  amountRaw: BigNumber;
  sender: string;
  recipient: string;
  owner: string;
  token: CheqCurrency;
  formattedSender: string;
  formattedRecipient: string;
  createdDate: Date;
  isCashed: boolean;
  hasEscrow: boolean;
  fundedDate: Date | null;
  fundedTimestamp: number;
  casher: string | null;
  cashedDate: Date | null;
  transactions: CheqTransactions;
}

const currencyForTokenId = (tokenId: any): CheqCurrency => {
  // TODO: Map token addresses
  return "DAI";
};

const convertExponent = (amountExact: number) => {
  // Use right exponent
  return Number(BigInt(amountExact) / BigInt(10 ** 16)) / 100;
};

const formatAdress = (adress: string, account: string) => {
  if (adress.toLowerCase() === account.toLowerCase()) {
    return "You";
  }
  return adress.slice(0, 8) + "...";
};

export const useCheqs = ({ cheqField }: Props) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const [cheqsReceived, setCheqReceived] = useState<Cheq[] | undefined>(
    undefined
  );
  const [cheqsSent, setCheqsSent] = useState<Cheq[] | undefined>(undefined);

  const mapField = useCallback(
    (gqlCheq: any) => {
      const cashedCheqs = gqlCheq.escrows.filter(
        (gqlCheq: any) => BigInt(gqlCheq.amount) < 0
      );
      const { isCashed, casher, cashedDate, cashedTx } =
        cashedCheqs.length > 0
          ? {
              isCashed: true,
              casher: cashedCheqs[0].emitter.id,
              cashedDate: new Date(Number(cashedCheqs[0].timestamp) * 1000),
              cashedTx: cashedCheqs[0].transaction.id,
            }
          : { isCashed: false, casher: null, cashedDate: null, cashedTx: null };

      const escrowedCheqs = gqlCheq.escrows.filter(
        (gqlCheq: any) => BigInt(gqlCheq.amount) > 0
      );
      const { hasEscrow, fundedDate, fundedTimestamp, fundedTx } =
        escrowedCheqs.length > 0
          ? {
              hasEscrow: true,
              fundedDate: new Date(Number(escrowedCheqs[0].timestamp) * 1000),
              fundedTimestamp: Number(escrowedCheqs[0].timestamp),
              fundedTx: escrowedCheqs[0].transaction.id,
            }
          : {
              hasEscrow: false,
              fundedDate: null,
              fundedTimestamp: 0,
              fundedTx: null,
            };

      const allCheqs = [...gqlCheq.escrows].sort((a: any, b: any) => {
        return Number(a.timestamp) - Number(b.timestamp);
      });
      const createdTx = allCheqs.length > 0 ? allCheqs[0].transaction.id : null;

      return {
        id: gqlCheq.id as string,
        amount: convertExponent(gqlCheq.amountExact as number),
        amountRaw: BigNumber.from(gqlCheq.amountExact),
        token: currencyForTokenId(gqlCheq.erc20.id),
        recipient: gqlCheq.recipient.id as string,
        sender: gqlCheq.drawer.id as string,
        owner: gqlCheq.owner.id as string,
        formattedSender: formatAdress(
          gqlCheq.drawer.id as string,
          blockchainState.account
        ),
        formattedRecipient: formatAdress(
          gqlCheq.recipient.id as string,
          blockchainState.account
        ),
        createdDate: new Date(Number(gqlCheq.createdAt) * 1000),
        isCashed,
        hasEscrow,
        fundedDate,
        casher,
        fundedTimestamp,
        cashedDate,
        transactions: {
          created: createdTx,
          funded: fundedTx,
          cashed: cashedTx,
        },
      };
    },
    [blockchainState.account]
  );

  const refresh = useCallback(() => {
    if (account) {
      const tokenFields = `      
      id
      amountExact
      escrowedExact
      createdAt
      drawer {
        id
      }
      recipient {
        id
      }
      owner {
        id
      }
      erc20 {
        id
      }
      escrows {
        id
        amount
        emitter {
          id
        }
        timestamp
        transaction {
          id
        }
      }
      `;

      // TODO: pagination
      const tokenQuery = `
      query accounts($account: String ){
        accounts(where: { id: $account }, first: 1)  {
          cheqsSent(orderBy: createdAt, orderDirection: desc) {
            ${tokenFields}
          }
          cheqsReceived(orderBy: createdAt, orderDirection: desc) {
            ${tokenFields}
          }
       }
      }
      `;

      const client = new ApolloClient({
        uri: APIURL,
        cache: new InMemoryCache(),
      });
      client
        .query({
          query: gql(tokenQuery),
          variables: {
            account: account.toLowerCase(),
          },
        })
        .then((data) => {
          console.log({ data });
          if (data["data"]["accounts"][0]) {
            const gqlCheqsSent = data["data"]["accounts"][0][
              "cheqsSent"
            ] as any[];
            const gqlCheqsReceived = data["data"]["accounts"][0][
              "cheqsReceived"
            ] as any[];
            setCheqsSent(gqlCheqsSent.map(mapField));
            setCheqReceived(gqlCheqsReceived.map(mapField));
          } else {
            setCheqsSent([]);
            setCheqReceived([]);
          }
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [account, mapField]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cheqs = useMemo(() => {
    if (cheqsReceived === undefined || cheqsSent === undefined) {
      return undefined;
    }
    switch (cheqField) {
      case "cheqsSent":
        return cheqsSent;
      case "cheqsReceived":
        return cheqsReceived;
      default:
        return cheqsReceived.concat(cheqsSent).sort((a, b) => {
          return b.createdDate.getTime() - a.createdDate.getTime();
        });
    }
  }, [cheqField, cheqsReceived, cheqsSent]);

  return { cheqs, refresh };
};
