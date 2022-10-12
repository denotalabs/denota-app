import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

const auditorTokenQuery = `
query accounts($account: String ){
  accounts(where: { id: $account })  {

    tokensAuditing {
      id
      createdAt
      amount
      expiry
      ercToken {
        id
      }
      status
      transactionHash
      drawer {
        id
      }
      recipient {
        id
      }
      auditor {
        id
      }
    }
  }
}
`;

export const useTokens = (isTokenSelect: string, isUser: boolean) => {
  const blockchainState = useBlockchainData();
  const account = blockchainState.account;
  const [tokenData, setTokenData] = useState<any>();

  useEffect(() => {
    if (account) {
      isTokenSelect = isTokenSelect ? isTokenSelect : "tokensOwned";
      const userTokenQuery = `
      query accounts($account: String ){
        accounts(where: { id: $account }, first: 1)  {
          ${isTokenSelect} {
            id
            createdAt
            amount
            expiry
            ercToken {
              id
            }
            status
            transactionHash
            drawer {
              id
            }
            recipient {
              id
            }
            auditor {
              id
            }
          }
        }
      }
      `;
      const tokenQuery = isUser ? userTokenQuery : auditorTokenQuery;

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
          if (data["data"]["accounts"][0]) {
            setTokenData(data["data"]["accounts"][0][isTokenSelect]);
          } else {
            setTokenData(null);
          }
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [account, isTokenSelect, isUser]);

  return tokenData;
};
