import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

export const useUsers = (getUser: boolean) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const [userData, setUserData] = useState<any>();
  const userTypeField = getUser ? "userAccount" : "auditorAccount";
  const userTypeDict = {
    auditorAccount: "auditorAccount {id}",
    userAccount: "userAccount {id}",
  };
  const usersQuery = `
  query handshakes{
    handshakes {
      ${userTypeDict[userTypeField]}
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
        .query({ query: gql(usersQuery) })
        .then((data) => {
          const shakes = getUser
            ? data["data"]["handshakes"].map((shake: any) => {
                return shake.userAccount.id;
              })
            : data["data"]["handshakes"].map((shake: any) => {
                return shake.auditorAccount.id;
              });
          const users = Array.from(new Set(shakes));
          setUserData(users);
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
        });
    }
  }, [getUser, account]);
  return userData;
};
