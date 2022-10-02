import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

const auditorAccountQuery = `
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

    auditorsRequested {
      id
      auditorAddress {
        id
      }
      isWaiting
      createdAt
    }
    usersRequested {
      id
      userAddress {
        id
      }
      isWaiting
      createdAt
    }
  }
}
`;

export const useAccount = (isUser: boolean, isTokenSelect: string) => {
  const blockchainState = useBlockchainData();
  const account = blockchainState.account;
  const [accountData, setAccountData] = useState<any>();

  useEffect(() => {
    if (account) {
      isTokenSelect = isTokenSelect ? isTokenSelect : "tokensOwned";
      let userAccountQuery;
      if (isTokenSelect == "all") {
        userAccountQuery = `
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
            tokensSent {
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
            tokensReceived {
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
            usersRequested {
              id
              userAddress {
                id
              }
              isWaiting
              createdAt
            }
          }
        }
        `;
      } else {
        userAccountQuery = `
      query accounts($account: String ){
        accounts(where: { id: $account })  {
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
          auditorsRequested {
            id
            auditorAddress {
              id
            }
            isWaiting
            createdAt
          }
          usersRequested {
            id
            userAddress {
              id
            }
            isWaiting
            createdAt
          }
        }
      }
      `;
      }

      const query = isUser ? userAccountQuery : auditorAccountQuery;
      const client = new ApolloClient({
        uri: APIURL,
        cache: new InMemoryCache(),
      });
      client
        .query({
          query: gql(query),
          variables: {
            account: account.toLowerCase(),
            tokenType: isTokenSelect,
          },
        })
        .then((data) => {
          setAccountData(data["data"]["accounts"][0]);
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [account, isTokenSelect]);

  return accountData;
};
