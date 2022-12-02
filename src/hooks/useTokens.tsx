import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

// Cheqs that are being audited by the specified account
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

export const useTokens = (tokenField: string, isUser: boolean) => {
  const blockchainState = useBlockchainData();
  const account = blockchainState.account;
  const [tokenData, setTokenData] = useState<any>();

  useEffect(() => {
    if (account) {
      tokenField = tokenField ? tokenField : "tokensOwned";
      const userTokenQuery = `
      query accounts($account: String ){
        accounts(where: { id: $account }, first: 1)  {
          ${tokenField} {
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
            setTokenData(data["data"]["accounts"][0][tokenField]);
          } else {
            setTokenData(null);
          }
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [account, tokenField, isUser]);

  return tokenData;
};
