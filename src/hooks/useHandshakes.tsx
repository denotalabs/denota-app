import React, { useEffect, useState } from "react";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { useBlockchainData, APIURL } from "../context/BlockchainDataProvider";

const userHandshakeQuery = `
query handshakes($auditorRequests: [String] ){
  handshakes(where: { id_in: $auditorRequests})  {
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
  handshakes(where: { id_in: $userRequests})  {
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
          const requested = data["data"]["handshakes"].map((handshake: any) => {
            if (!handshake.completed) {
              if (isUser) {
                return handshake.auditorAccount.id;
              } else {
                return handshake.userAccount.id;
              }
            }
          });
          const completed = data["data"]["handshakes"].map((handshake: any) => {
            if (handshake.completed) {
              if (isUser) {
                return handshake.auditorAccount.id;
              } else {
                return handshake.userAccount.id;
              }
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

//   let requests = isUser
//     ? data["data"]["accounts"][0]["auditorsRequested"]
//     : data["data"]["accounts"][0]["usersRequested"];
//   if (isUser) {
//     const requestedAuditors = // Requests initiated by user
//       requests.map((auditor: any) => {
//         if (auditor.isWaiting) {
//           return (
//             auditor.auditorAddress.id.toLowerCase() +
//             account.toLowerCase()
//           );
//         }
//       });

//     client
//       .query({
//         query: gql(userHandshakeQuery),
//         variables: { auditorRequests: requestedAuditors },
//       })
//       .then((data) => {
//         const completeShakes = data["data"]["handshakes"].map(
//           (shake: any) => {
//             return shake.auditorShake.auditorAddress.id;
//           }
//         );
// setHandshakeData({
//   completed: completeShakes,
//   requested: requestedAuditors,
// });
//       })
//       .catch((err) => {
//         console.log("Error fetching data: ", err);
//       });
//   } else {
//     const requestedUsers = requests.map((user: any) => {
//       if (user.isWaiting) {
//         return (
//           account.toLowerCase() + user.userAddress.id.toLowerCase()
//         );
//       }
//     });
//     client
//       .query({
//         query: gql(auditorHandshakeQuery),
//         variables: { userRequests: requestedUsers },
//       })
//       .then((data) => {
//         const completeShakes = data["data"]["handshakes"].map(
//           (shake: any) => {
//             return shake.userShake.userAddress.id;
//           }
//         );
//         setHandshakeData({
//           completed: completeShakes,
//           requested: requestedUsers,
//         });
//       })
//       .catch((err) => {
//         console.log("Error fetching data: ", err);
//       });
//   }
