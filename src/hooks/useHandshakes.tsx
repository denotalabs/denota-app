import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

const userHandshakeQuery = `
query handshakes($auditorRequests: [String] ){
  handshakes(where: { id_in: $auditorRequests, completed: true })  {
    auditorShake {
        auditorAddress {
            id
        }
    }
  }
}
`;

const auditorHandshakeQuery = `
query handshakes($userRequests: [String] ){
  handshakes(where: { id_in: $userRequests, completed: true })  {
    userShake {
        userAddress {
            id
        }
    }
  }
}
`;

export const useHandshakes = (isUser: boolean) => {
  const blockchainState = useBlockchainData();
  const account = blockchainState.account;
  const [handshakeData, setHandshakeData] = useState<any>();
  const accountRequestedQuery = `
  query accounts($account: String ){
    accounts(where: { id: $account })  {
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

  useEffect(() => {
    if (account) {
      const client = new ApolloClient({
        uri: APIURL,
        cache: new InMemoryCache(),
      });

      client
        .query({
          query: gql(accountRequestedQuery),
          variables: { account: account.toLowerCase() },
        })
        .then((data) => {
          let requests = isUser
            ? data["data"]["accounts"][0]["auditorsRequested"]
            : data["data"]["accounts"][0]["usersRequested"];
          if (isUser) {
            const requestedAuditors = // Requests initiated by user
              requests.map((auditor: any) => {
                if (auditor.isWaiting) {
                  return (
                    auditor.auditorAddress.id.toLowerCase() +
                    account.toLowerCase()
                  );
                }
              });

            client
              .query({
                query: gql(userHandshakeQuery),
                variables: { auditorRequests: requestedAuditors },
              })
              .then((data) => {
                const completeShakes = data["data"]["handshakes"].map(
                  (shake: any) => {
                    return shake.auditorShake.auditorAddress.id;
                  }
                );
                setHandshakeData({
                  completed: completeShakes,
                  requested: requestedAuditors,
                });
              })
              .catch((err) => {
                console.log("Error fetching data: ", err);
              });
          } else {
            const requestedUsers = requests.map((user: any) => {
              if (user.isWaiting) {
                return (
                  account.toLowerCase() + user.userAddress.id.toLowerCase()
                );
              }
            });
            client
              .query({
                query: gql(auditorHandshakeQuery),
                variables: { userRequests: requestedUsers },
              })
              .then((data) => {
                const completeShakes = data["data"]["handshakes"].map(
                  (shake: any) => {
                    return shake.userShake.userAddress.id;
                  }
                );
                setHandshakeData({
                  completed: completeShakes,
                  requested: requestedUsers,
                });
              })
              .catch((err) => {
                console.log("Error fetching data: ", err);
              });
          }
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [isUser, account]);
  return handshakeData;
};
