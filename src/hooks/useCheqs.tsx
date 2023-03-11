import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheqCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";

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
  receiver: string;
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
  payer: string;
  payee: string;
  dueDate?: Date;
}

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

  const currencyForTokenId = useCallback(
    (tokenAddress: string): CheqCurrency => {
      switch (tokenAddress) {
        case blockchainState.dai?.address.toLowerCase():
          return "DAI";
        case blockchainState.weth?.address.toLowerCase():
          return "WETH";
        default:
          return "USDC";
      }
    },
    [blockchainState.dai?.address, blockchainState.weth?.address]
  );

  const mapField = useCallback(
    (gqlCheq: any) => {
      // TODO: Move this logic to graph (mappings.ts)

      const allEscrows = [...gqlCheq.escrows].sort((a: any, b: any) => {
        return Number(a.timestamp) - Number(b.timestamp);
      });
      const createdTx =
        allEscrows.length > 0 ? allEscrows[0].transaction.id : null;

      const isInvoice = gqlCheq.sender.id === gqlCheq.owner.id;

      const escrowedCheqs = gqlCheq.escrows.filter(
        (gqlCheq: any) =>
          BigInt(gqlCheq.amount) > 0 || BigInt(gqlCheq.instantAmount) > 0
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
        ? (gqlCheq.receiver.id as string)
        : (gqlCheq.sender.id as string);

      const payee = isInvoice
        ? (gqlCheq.sender.id as string)
        : (gqlCheq.receiver.id as string);

      const isPayer = payer === blockchainState.account.toLowerCase();

      let dueDate: Date | undefined = undefined;

      if (gqlCheq.moduleData.dueDate) {
        dueDate = new Date(Number(gqlCheq.moduleData.dueDate) * 1000);
      }

      return {
        id: gqlCheq.id as string,
        amount: convertExponent(gqlCheq.moduleData.amount as number),
        amountRaw: BigNumber.from(gqlCheq.moduleData.amount),
        token: currencyForTokenId(gqlCheq.erc20.id),
        receiver: gqlCheq.receiver.id as string,
        sender: gqlCheq.sender.id as string,
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
        payer,
        payee,
        dueDate,
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
      moduleData {
        ... on DirectPayData {
          amount
          creditor {
            id
          }
          debtor {
            id
          }
          dueDate
        }
      }
      escrows {
        id
        amount
        instantAmount
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
        uri: blockchainState.graphUrl,
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
          setIsLoading(false);
        });
    }
  }, [account, blockchainState.graphUrl, mapField]);

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
