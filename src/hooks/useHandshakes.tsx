import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";
import { useAccount } from "./useAccount";

const auditorHandshakeQuery = `
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

const userHandshakeQuery = `
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
  const accountData = useAccount(isUser, "");
  const [handshakeData, setHandshakeData] = useState<any>();

  useEffect(() => {
    if (accountData) {
      const client = new ApolloClient({
        uri: APIURL,
        cache: new InMemoryCache(),
      });
      if (isUser) {
        const auditorRequests = accountData.auditorsRequested.map(
          (auditor: any) => {
            if (auditor.isWaiting) {
              return (
                auditor.auditorAddress.id.toLowerCase() + account.toLowerCase()
              );
            }
          }
        );
        client
          .query({
            query: gql(auditorHandshakeQuery),
            variables: {
              auditorRequests: auditorRequests,
            },
          })
          .then((data) => {
            const completeShakes = data["data"]["handshakes"].map(
              (shake: any) => {
                return shake.auditorShake.auditorAddress.id;
              }
            );
            setHandshakeData(completeShakes);
          })
          .catch((err) => {
            console.log("Error fetching data: ", err);
          });
      } else {
        const userRequests = accountData.usersRequested.map((user: any) => {
          if (user.isWaiting) {
            return account.toLowerCase() + user.userAddress.id.toLowerCase();
          }
        });
        client
          .query({
            query: gql(userHandshakeQuery),
            variables: {
              userRequests: userRequests,
            },
          })
          .then((data) => {
            const completeShakes = data["data"]["handshakes"].map(
              (shake: any) => {
                return shake.userShake.userAddress.id;
              }
            );
            setHandshakeData(completeShakes);
          })
          .catch((err) => {
            console.log("Error fetching data: ", err);
          });
      }
    }
  }, [accountData]);

  return handshakeData;
};
