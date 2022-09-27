import React, {
  createContext,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";
//accounts($account: String )  //(first: 10, where: { id: $account })
//   const accountQuery = `
//   query {
//     accounts {
//       id
//       tokensOwned
//       numTokensOwned
//       tokensSent
//       numTokensSent
//       tokensAuditing
//       numTokensAuditing
//       tokensReceived
//       numTokensReceived
//       tokensCashed
//       numTokensCashed
//       tokensVoided
//       numTokensVoided
//       voidedTokens
//       numVoidedTokens
//       auditorsRequested
//       numAuditorsRequested
//       usersRequested
//       numUsersRequested
//     }
//   }
// `;
// const accountQuery = `
// query {
//   accounts {
//     id
//     numTokensOwned
//     numTokensSent
//     numTokensAuditing
//     numTokensReceived
//     tokensCashed
//     numTokensCashed
//     tokensVoided
//     numTokensVoided
//     voidedTokens
//     numVoidedTokens
//     numAuditorsRequested
//     numUsersRequested
//   }
// }
// `;

const accountQuery = `
query accounts($account: String ){
  accounts(where: { id: $account })  {
    id
    numTokensOwned
    numTokensSent
    numTokensAuditing
    numTokensReceived
    tokensCashed
    numTokensCashed
    tokensVoided
    numTokensVoided
    voidedTokens
    numVoidedTokens
    numAuditorsRequested
    numUsersRequested
  }
}
`;

export const useAccount = () => {
  const blockchainState = useBlockchainData();
  const account = blockchainState.account;
  const [accountData, setAccountData] = useState<any>();

  useEffect(() => {
    if (account) {
      console.log(account);

      const client = new ApolloClient({
        uri: APIURL,
        cache: new InMemoryCache(),
      });
      client
        .query({
          query: gql(accountQuery),
          variables: {
            account: account,
          },
        })
        .then((data) => {
          console.log("Subgraph data: ", data);
          setAccountData(data);
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [account]);

  return accountData;
};
