import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  formattedPayer: string;
  formattedPayee: string;
  isInvoice: boolean;
  createdTransaction: CheqTransaction;
  fundedTransaction: CheqTransaction | null;
  isPaid: boolean;
  isPayer: boolean;
  uri: string;
}

const currencyForTokenId = (): CheqCurrency => {
  // TODO: Map token addresses
  return "DAI";
};

const convertExponent = (amountExact: number) => {
  // Use right exponent
  return Number(BigInt(amountExact) / BigInt(10 ** 16)) / 100;
};

const formatAddress = (adress: string, account: string) => {
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

      const allEscrows = [...gqlCheq.escrows].sort((a: any, b: any) => {
        return Number(a.timestamp) - Number(b.timestamp);
      });
      const createdTx =
        allEscrows.length > 0 ? allEscrows[0].transaction.id : null;

      const isInvoice = gqlCheq.drawer.id === gqlCheq.owner.id;

      const escrowedCheqs = gqlCheq.escrows.filter(
        (gqlCheq: any) =>
          BigInt(gqlCheq.amount) > 0 || BigInt(gqlCheq.directAmount) > 0
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

      const payer = isInvoice
        ? (gqlCheq.recipient.id as string)
        : (gqlCheq.drawer.id as string);

      const payee = isInvoice
        ? (gqlCheq.drawer.id as string)
        : (gqlCheq.recipient.id as string);

      const isPayer = payer === blockchainState.account.toLowerCase();

      return {
        id: gqlCheq.id as string,
        amount: convertExponent(gqlCheq.amountExact as number),
        amountRaw: BigNumber.from(gqlCheq.amountExact),
        token: currencyForTokenId(),
        recipient: gqlCheq.recipient.id as string,
        sender: gqlCheq.drawer.id as string,
        owner: gqlCheq.owner.id as string,
        formattedPayer: formatAddress(payer, blockchainState.account),
        formattedPayee: formatAddress(payee, blockchainState.account),
        createdTransaction: {
          date: new Date(Number(gqlCheq.timestamp) * 1000),
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
        isPaid: hasEscrow,
        uri: gqlCheq.uri,
        isPayer,
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
      timestamp
      uri
      drawer {
        id
      }
      recipient {
        id
      }
      owner {
        id
      }
      escrows {
        id
        amount
        directAmount
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
          setIsLoading(false);
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
