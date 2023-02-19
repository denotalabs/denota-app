import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheqCurrency } from "../components/designSystem/CurrencyIcon";
import {
  APIURL_REMOTE,
  useBlockchainData,
} from "../context/BlockchainDataProvider";

interface Props {
  cheqField: string;
}

export interface CheqTransactions {
  created: string | null;
  funded: string | null;
  cashed: string | null;
}

export interface CheqDates {
  created: Date;
}

export interface CheqTransaction {
  date: Date;
  hash: string;
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
  isCashed: boolean;
  hasEscrow: boolean;
  isInvoice: boolean;
  isVoided: boolean;
  isFunder: boolean;
  fundedTimestamp: number;
  casher: string | null;
  createdTransaction: CheqTransaction;
  fundedTransaction: CheqTransaction | null;
  cashedTransaction: CheqTransaction | null;
  maturityDate?: Date;
  isEarlyReleased: boolean;
  isCashable: boolean;
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
  return adress.slice(0, 5) + "..." + adress.slice(-4);
};

export const useCheqs = ({ cheqField }: Props) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const [cheqsReceived, setCheqReceived] = useState<Cheq[] | undefined>(
    undefined
  );
  const [cheqsSent, setCheqsSent] = useState<Cheq[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const mapField = useCallback(
    (gqlCheq: any) => {
      // TODO: Move this logic to graph (mappings.ts)

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

      const allEscrows = [...gqlCheq.escrows].sort((a: any, b: any) => {
        return Number(a.timestamp) - Number(b.timestamp);
      });
      const createdTx =
        allEscrows.length > 0 ? allEscrows[0].transaction.id : null;

      const funder = gqlCheq.selfSignedData.cheqFunder.id;
      const isInvoice = gqlCheq.recipient.id === funder;
      const isVoided = casher === funder;
      const isFunder =
        blockchainState.account.toLowerCase() === funder.toLowerCase();
      const maturityTime =
        fundedTimestamp === 0
          ? undefined
          : fundedTimestamp +
            Number(gqlCheq.selfSignedData.cheqInspectionPeriod);

      const isEarlyReleased = gqlCheq.selfSignedData.isEarlyReleased as boolean;
      let isCashable = false;

      if (!isCashed) {
        if (isEarlyReleased && !isFunder) {
          isCashable = true;
        } else if (
          !isFunder &&
          hasEscrow &&
          maturityTime &&
          Math.floor(Date.now() / 1000) > maturityTime
        ) {
          isCashable = true;
        } else if (
          isFunder &&
          hasEscrow &&
          maturityTime &&
          Math.floor(Date.now() / 1000) < maturityTime
        ) {
          isCashable = true;
        }
      }

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
        createdTransaction: {
          date: new Date(Number(gqlCheq.createdAt) * 1000),
          hash: createdTx,
        },
        fundedTransaction:
          fundedDate && fundedTx
            ? {
                date: fundedDate,
                hash: fundedTx,
              }
            : null,
        cashedTransaction:
          cashedDate && cashedTx
            ? {
                date: cashedDate,
                hash: cashedTx,
              }
            : null,
        isInvoice,
        isVoided,
        isFunder,
        maturityDate: maturityTime ? new Date(maturityTime * 1000) : undefined,
        isEarlyReleased: gqlCheq.selfSignedData.isEarlyReleased as boolean,
        isCashable,
      };
    },
    [blockchainState.account]
  );

  const refresh = useCallback(() => {
    if (account) {
      setIsLoading(true);
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
      selfSignedData {
        id
        cheqFunder {
          id
        }
        cheqInspectionPeriod
        isEarlyReleased
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

      // SWITCH BACK TO PROD URL BEFORE MERGE
      const client = new ApolloClient({
        uri: APIURL_REMOTE,
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
            setIsLoading(false);
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
  }, [refresh, account]);

  const cheqs = useMemo(() => {
    if (cheqsReceived === undefined || cheqsSent === undefined || isLoading) {
      return undefined;
    }
    switch (cheqField) {
      case "cheqsSent":
        return cheqsSent;
      case "cheqsReceived":
        return cheqsReceived;
      default:
        return cheqsReceived.concat(cheqsSent).sort((a, b) => {
          return (
            b.createdTransaction.date.getTime() -
            a.createdTransaction.date.getTime()
          );
        });
    }
  }, [cheqField, cheqsReceived, cheqsSent, isLoading]);

  return { cheqs, refresh };
};
