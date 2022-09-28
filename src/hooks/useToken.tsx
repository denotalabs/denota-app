import React, {
  createContext,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

const tokensQuery = `
  query {
    tokens {
      id
      createdAt
      amount
      expiry
      ercToken
      status
      transactionHash
      owner
      drawer
      recipient
      auditor
    }
  }
`;

export const useToken = (field: string) => {
  const blockchainState = useBlockchainData();
  const account = blockchainState.account;
  const [tokenData, setTokenData] = useState<any>();

  useEffect(() => {
    if (account) {
      const client = new ApolloClient({
        uri: APIURL,
        cache: new InMemoryCache(),
      });
      client
        .query({
          query: gql(tokensQuery),
          variables: {
            field: field,
            account: account.toLowerCase(),
          },
        })
        .then((data) => {
          console.log("Subgraph data: ", data["data"]);
          setTokenData(data["data"]);
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [account]);

  return tokenData;
};
