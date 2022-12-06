import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

export const useHandshakes = (isUser: boolean) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const [handshakeData, setHandshakeData] = useState<any>();
  const userTypeField = isUser ? "userAccount" : "auditorAccount";
  const handshakeQuery = `
  query handshakes($account: String ){
    handshakes(where: { ${userTypeField}: $account})  {
      userAccount {
        id
      }
      userShake
      userLastShake
    
      auditorAccount {
        id
      }
      auditorShake
      auditorLastShake
    
      completed
      lastCompleted
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
          query: gql(handshakeQuery),
          variables: { account: account.toLowerCase() },
        })
        .then((data) => {
          const handshakes = data["data"]["handshakes"];
          const completed = handshakes
            .filter((handshake: any) => handshake.completed)
            .map((handshake: any) => {
              if (isUser) {
                return handshake.auditorAccount.id;
              } else {
                return handshake.userAccount.id;
              }
            });
          const requested = handshakes
            .filter((handshake: any) => !handshake.completed)
            .map((handshake: any) => {
              if (isUser) {
                return handshake.auditorAccount.id;
              } else {
                return handshake.userAccount.id;
              }
            });

          setHandshakeData({
            completed: completed,
            requested: requested,
          });
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [isUser, account]);
  return handshakeData;
};
