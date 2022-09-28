import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

const accountQuery = `
query accounts($account: String ){
  accounts(where: { id: $account })  {

    tokensOwned {
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
    auditorsRequested {
      id
      auditorAddress {
        id
      }
      isWaiting
      createdAt
    }
  }
}
`;

export const useAccount = () => {
  const blockchainState = useBlockchainData();
  const account = blockchainState.account;
  const [accountData, setAccountData] = useState<any>();

  useEffect(() => {
    if (account) {
      const client = new ApolloClient({
        uri: APIURL,
        cache: new InMemoryCache(),
      });
      client
        .query({
          query: gql(accountQuery),
          variables: {
            account: account.toLowerCase(),
          },
        })
        .then((data) => {
          console.log("Subgraph data: ", data["data"]["accounts"][0]);
          setAccountData(data["data"]["accounts"][0]);
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [account]);

  return accountData;
};

// const accountQuery = `
// query accounts($account: String ){
//   accounts(where: { id: $account })  {
//     id

//     tokensOwned {
//       id
//       createdAt
//       amount
//       expiry
//       ercToken
//       status
//       transactionHash
//       owner
//       drawer
//       recipient
//       auditor
//     }
//     numTokensOwned

//     tokensSent {
//       id
//     }
//     numTokensSent

//     tokensAuditing {
//       id
//     }
//     numTokensAuditing

//     tokensReceived{
//       id
//     }
//     numTokensReceived

//     tokensCashed {
//       id
//     }
//     numTokensCashed

//     tokensVoided {
//       id
//     }
//     numTokensVoided

//     voidedTokens {
//       id
//     }
//     numVoidedTokens

//     auditorsRequested {
//       id
//     }
//     numAuditorsRequested

//     usersRequested {
//       id
//     }
//     numUsersRequested
//   }
// }
// `;
