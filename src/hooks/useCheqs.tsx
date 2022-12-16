import React, { useEffect, useMemo, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";
import { CheqCurrency } from "../components/designSystem/CurrencyIcon";

interface Props {
  cheqField: string;
}

export interface Cheq {
  id: string;
  amount: number;
  escrowed: number;
  sender: string;
  recipient: string;
  token: CheqCurrency;
}

export const useCheqs = ({ cheqField }: Props) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const [cheqsReceived, setCheqReceived] = useState<Cheq[]>([]);
  const [cheqsSent, setCheqsSent] = useState<Cheq[]>([]);

  useEffect(() => {
    console.log({ account });
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
            console.log({ data });
            // setCheqsSent(data["data"]["accounts"][0]["cheqsSent"]);
            // setCheqReceived(data["data"]["accounts"][0]["cheqsReceived"]);
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

  const cheqs = useMemo(() => {
    switch (cheqField) {
      case "cheqsSent":
        return cheqsSent;
      case "cheqsReceived":
        return cheqsReceived;
      default:
        return cheqsReceived.concat(cheqsSent);
    }
  }, [cheqField]);

  return { cheqs };
};
