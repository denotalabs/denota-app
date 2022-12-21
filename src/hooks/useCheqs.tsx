import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";
import { CheqCurrency } from "../components/designSystem/CurrencyIcon";
import { BigNumber } from "ethers";

interface Props {
  cheqField: string;
}

export interface Cheq {
  id: string;
  amount: number;
  amountRaw: BigNumber;
  escrowed: number;
  sender: string;
  recipient: string;
  owner: string;
  token: CheqCurrency;
  formattedSender: string;
  formattedRecipient: string;
}

const currencyForTokenId = (tokenId: any): CheqCurrency => {
  // TODO: Map token addresses
  return "DAI";
};

const convertExponent = (amountExact: number) => {
  // Use right exponent
  return Number(BigInt(amountExact) / BigInt(10 ** 18));
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
  const [cheqsReceived, setCheqReceived] = useState<Cheq[]>([]);
  const [cheqsSent, setCheqsSent] = useState<Cheq[]>([]);

  const mapField = useCallback(
    (gqlCheq: any) => {
      return {
        id: gqlCheq.id as string,
        amount: convertExponent(gqlCheq.amountExact as number),
        amountRaw: BigNumber.from(gqlCheq.amountExact),
        escrowed: Number(gqlCheq.escrowedExact),
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
      };
    },
    [blockchainState.account]
  );

  const refresh = useCallback(() => {
    if (account) {
      // TODO: replace with where _or clause on cheqs
      const tokenQuery = `
      query accounts($account: String ){
        accounts(where: { id: $account }, first: 1)  {
          cheqsSent {
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
          }
          cheqsReceived {
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
  }, [account]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cheqs = useMemo(() => {
    switch (cheqField) {
      case "cheqsSent":
        return cheqsSent;
      case "cheqsReceived":
        return cheqsReceived;
      default:
        return cheqsReceived.concat(cheqsSent);
    }
  }, [cheqField, cheqsReceived, cheqsSent]);

  return { cheqs, refresh };
};
