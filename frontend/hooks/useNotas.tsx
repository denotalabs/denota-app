import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { contractMappingForChainId } from "@denota-labs/denota-sdk";
// import { DirectSendData } from "@denota-labs/denota-sdk/dist/modules/DirectSend";
// import { SimpleCashData } from "@denota-labs/denota-sdk/dist/modules/SimpleCash";
// import { ReversibleReleaseData } from "@denota-labs/denota-sdk/dist/modules/ReversibleRelease";
// import { CashBeforeDateData } from "@denota-labs/denota-sdk/dist/modules/CashBeforeDate";
// import { ReversibleByBeforeDateData } from "@denota-labs/denota-sdk/dist/modules/ReversibleByBeforeDate";
// import { CashBeforeDateDripData } from "@denota-labs/denota-sdk/dist/modules/CashBeforeDateDrip";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useTokens } from "./useTokens";

interface Props {
  notaField: string;
}

export interface NotaDates {
  created: Date;
}

export interface NotaTransaction {
  date: Date;
  hash: string;
}

// TODO need to set and pull these from the SDK
export type DirectPayStatus = "paid";

export type SimpleCashStatus = "claimable" | "awaiting_claim" | "claimed";

export type CashBeforeDateStatus = "claimable" | "awaiting_claim" | "claimed" | "expired" | "returnable" | "returned";

export type CashBeforeDateDripStatus = "claimable" | "awaiting_claim" | "claimed" | "expired" | "returnable" | "returned" | "locked";

export type ReversibleReleaseStatus = "releasable" | "awaiting_release" | "returned" | "released";

export type ReversibleByBeforeDateStatus = "releasable" | "awaiting_release" | "released" | "returned" | "claimable" | "awaiting_claim" | "claimed";

export interface DirectSendModuleData {
  status: DirectPayStatus;
  module: "directSend";
}

export interface SimpleCashModuleData {
  status: SimpleCashStatus;
  module: "simpleCash";
}

export interface CashBeforeDateModuleData {
  status: CashBeforeDateStatus;
  module: "cashBeforeDate";
}

export interface ReversibleReleaseModuleData {
  status: ReversibleReleaseStatus;
  module: "reversibleRelease";
}

export interface ReversibleByBeforeDateModuleData {
  status: ReversibleByBeforeDateStatus;
  module: "reversibleByBeforeDate";
}

export interface CashBeforeDateDripModuleData {
  status: CashBeforeDateDripStatus;
  module: "cashBeforeDateDrip";
}

export type ModuleData = DirectSendModuleData | SimpleCashModuleData | CashBeforeDateModuleData | ReversibleReleaseModuleData | ReversibleByBeforeDateModuleData | CashBeforeDateDripModuleData;
// TODO need to set and pull the above from the SDK

export interface Nota {
  id: string;
  token: NotaCurrency;
  amount: number;
  amountRaw: BigNumber;
  moduleData: ModuleData;
  sender: string;  // TODO: remove
  receiver: string;  // TODO: remove
  owner: string;
  createdTransaction: NotaTransaction;
  fundedTransaction: NotaTransaction | null;  // TODO have list of WTFCA transactions
  isPayer: boolean;  // TODO: remove but is passed to NotasContext
  payer: string;
  payee: string;
  inspector?: string;  // TODO: remove since should be in moduleData
  isInspector: boolean;  // TODO: remove since should be in moduleData
  uri?: string;
}

const convertExponent = (amountExact: number, exponent: number) => {
  const adjustedExponent = exponent - 3;
  return Number(BigInt(amountExact) / BigInt(10 ** adjustedExponent)) / 1000;
};

export const useNotas = ({ notaField }: Props) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account;
  const [notasReceived, setNotasReceived] = useState<Nota[] | undefined>(
    undefined
  );
  const [notasSent, setNotaSent] = useState<Nota[] | undefined>(undefined);
  const [notasInspected, setNotasInspected] = useState<Nota[] | undefined>(
    undefined
  ); // TODO: should be injected by module

  const [optimisticNotas, setOptimisticNotas] = useState<Nota[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  const addOptimisticNota = useCallback((nota: Nota) => {
    setOptimisticNotas((notas) => [...notas, nota]);
  }, []);

  const { getTokenUnits, currencyForTokenId } = useTokens();

  const mapField = useCallback(
    (gqlNota: any) => {
      const createdTx = gqlNota.createdTransaction.id;

      const isPayer =
        gqlNota.sender.id === blockchainState.account.toLowerCase();

      let isInspector = false; // TODO: expect inside module data

      let moduleData:
        | DirectSendModuleData
        | SimpleCashModuleData
        | CashBeforeDateModuleData
        | CashBeforeDateDripModuleData
        | ReversibleReleaseModuleData
        | ReversibleByBeforeDateModuleData;

      let status: "paid" | "claimable" | "awaiting_claim" | "awaiting_release" | "releasable" | "released" | "claimed" | "expired" | "returnable" | "returned" | "locked";

      const mapping = contractMappingForChainId(blockchainState.chhainIdNumber);

      switch (gqlNota.module.id) {
        case mapping.simpleCash.toLowerCase():
          const decoded = ethers.utils.defaultAbiCoder.encode(["string,string"], [gqlNota.moduleData.raw]);
          gqlNota.uri = decoded[0];
          gqlNota.imageURI = decoded[1];

          if (gqlNota.cashes.length > 0) {
            status = "claimed";
          } else if (gqlNota.owner.id === blockchainState.account.toLowerCase()) {
            status = "claimable";
          } else {
            status = "awaiting_claim";
          }
          moduleData = {
            module: "simpleCash",
            status,
          };
          break;
        case mapping.cashBeforeDate.toLowerCase():
          let decoded1 = ethers.utils.defaultAbiCoder.encode(["string,string"], [gqlNota.moduleData.raw]);
          gqlNota.expirationDate = decoded1[0];
          gqlNota.uri = decoded1[1];
          gqlNota.imageURI = decoded1[2];

          if (gqlNota.cashes.length > 0) {
            if (gqlNota.cashes[0].to == blockchainState.account.toLowerCase()) {
              status = "claimed";
            } else {
              status = "returned";
            }
          } else if (gqlNota.expirationDate >= Date.now()) {
            if (gqlNota.owner.id === blockchainState.account.toLowerCase()) {
              status = "claimable";
            } else {
              status = "awaiting_claim";
            }
          } else {
            if (gqlNota.owner.id === blockchainState.account.toLowerCase()) {
              status = "expired";
            } else {
              status = "returnable";
            }
          }

          moduleData = {
            module: "cashBeforeDate",
            status,
          };
          break;
        case mapping.cashBeforeDateDrip.toLowerCase():
          let decoded2 = ethers.utils.defaultAbiCoder.encode(["uint256,uint256,uint256,string,string"], [gqlNota.moduleData.raw]);
          gqlNota.dripAmount = decoded2[0];
          gqlNota.dripPeriod = decoded2[1];
          gqlNota.cashBeforeDate = decoded2[2];
          gqlNota.uri = decoded2[3];
          gqlNota.imageURI = decoded2[4];

          if (gqlNota.cashBeforeDate < Date.now()) { // expired for owner
            if (gqlNota.payer.id == blockchainState.account.toLowerCase()) {
              if (gqlNota.escrow != 0) {
                status = "returnable";
              } else {
                status = "returned";
              }
            } else {
              status = "expired";
            }
          } else if (gqlNota.lastDrip + gqlNota.dripPeriod <= Date.now()) {
            if (gqlNota.owner.id == blockchainState.account.toLowerCase()) {
              status = "claimable";
            } else {
              status = "awaiting_claim";
            }
          } else {
            status = "locked";
          }

          moduleData = {
            module: "cashBeforeDateDrip",
            status,
          };
          break;
        case mapping.reversibleRelease.toLowerCase():
          let decoded3 = ethers.utils.defaultAbiCoder.encode(["address,string,string"], [gqlNota.moduleData.raw]);
          gqlNota.inspector = decoded3[0];
          gqlNota.uri = decoded3[1];
          gqlNota.imageURI = decoded3[2];

          if (gqlNota.cashes.length > 0) {
            // TODO Need to know if the `to` went to the `owner` at the time it was released
            //// Need to check transfers and if >0 check if the cash timestamp was before it
            if (gqlNota.cashes[0].to == gqlNota.owner) {
              status = "released";
            } else {
              status = "returned";
            }
          } else {
            if (gqlNota.inspector.id === blockchainState.account.toLowerCase()) {
              status = "releasable";
            } else {
              status = "awaiting_release";
            }
          }

          moduleData = {
            module: "reversibleRelease",
            status,
          };
          break;
        case mapping.reversibleByBeforeDate.toLowerCase():
          let decoded4 = ethers.utils.defaultAbiCoder.encode(["address,uint256,string,string"], [gqlNota.moduleData.raw]);
          gqlNota.inspector = decoded4[0];
          gqlNota.expirationDate = decoded4[1];
          gqlNota.uri = decoded4[2];
          gqlNota.imageURI = decoded4[3];

          if (gqlNota.cashes.length > 0) {
            // TODO Need to know if the `to` went to the `owner` at the time it was released
            //// Need to check transfers and if >0 check if the cash timestamp was before it
            if (gqlNota.cashes[0].to == gqlNota.owner.id) {
              if (gqlNota.cashes[0].caller == gqlNota.inspector) {
                status = "released";
              } else {
                status = "claimed";
              }
            } else {
              status = "returned";
            }
          } else if (gqlNota.expirationDate > Date.now()) {  // Depends on inspector to release
            if (gqlNota.inspector === blockchainState.account.toLowerCase()) {
              status = "releasable";
            } else {
              status = "awaiting_release";
            }
          } else if (gqlNota.owner.id === blockchainState.account.toLowerCase()) {
            status = "claimable";
          } else {
            status = "awaiting_claim";
          }

          moduleData = {
            module: "reversibleByBeforeDate",
            status,
          };
          break;
        default: // Assumes direct pay if module is unknown
          const decoded5 = ethers.utils.defaultAbiCoder.encode(["string,string"], [gqlNota.moduleData.raw]);
          gqlNota.uri = decoded5[0];
          gqlNota.imageURI = decoded5[1];
          moduleData = { module: "directSend", status: "paid" };
      }

      const amount = // TODO Show payment amount and current escrow. Use Cashed/Funded.
        moduleData.module === "directSend"
          ? gqlNota.written.instant
          : gqlNota.written.escrowed;

      return {
        id: gqlNota.id as string,
        token: currencyForTokenId(gqlNota.currency.id),
        amount: convertExponent(
          Number(amount),
          getTokenUnits(currencyForTokenId(gqlNota.currency.id))
        ),
        amountRaw: BigNumber.from(amount),
        moduleData,

        // TODO keep sender/receiver OR payer/payee? Both?
        sender: gqlNota.sender.id as string,
        receiver: gqlNota.receiver.id as string,
        owner: gqlNota.owner.id as string,
        createdTransaction: {
          date: new Date(Number(gqlNota.createdTransaction.timestamp) * 1000),
          hash: createdTx,
        },
        fundedTransaction: null, // TODO: calculate based on escrow
        uri: gqlNota.uri,
        isPayer,
        payer: gqlNota.sender.id as string,
        payee: gqlNota.receiver.id as string,
        inspector: undefined,
        isInspector,
      };
    },
    [
      blockchainState.account,
      blockchainState.chhainIdNumber,
      currencyForTokenId,
      getTokenUnits,
    ]
  );

  const refresh = useCallback(() => {
    if (account) {
      setIsLoading(true);
      const notaFields = `      
      id
      currency {
        id
      }
      escrowed
      module {
        id
      }
      moduleData {
        raw
      }
      createdTransaction {
        timestamp
        id
      }
      sender {
        id
      }
      receiver {
        id
      }
      owner {
        id
      }
      cashes {
        id
      }
      written {
        instant
        escrowed
      }
      `;

      // TODO: pagination
      // TODO: remove references to nota from the graph schema
      const tokenQuery = gql`
      query accounts($account: String ){
        account(id: $account)  {
          notasSent {
            ${notaFields}
          }
          notasReceived {
            ${notaFields}
          }
       }
      }
      `;

      const client = new ApolloClient({
        uri: blockchainState.graphUrl,
        cache: new InMemoryCache(),
      });
      client
        .query({
          query: tokenQuery,
          variables: {
            account: account.toLowerCase(),
          },
        })
        .then((data) => {
          if (data["data"]["account"]) {
            const gqlNotasSent = data["data"]["account"]["notasSent"] as any[];
            const gqlNotasReceived = data["data"]["account"][
              "notasReceived"
            ] as any[];
            setNotaSent(
              gqlNotasSent.filter((nota) => nota.owner).map(mapField)
            );
            setNotasReceived(
              gqlNotasReceived.filter((nota) => nota.owner).map(mapField)
            );
            setNotasInspected([]);
          } else {
            setNotaSent([]);
            setNotasReceived([]);
            setNotasInspected([]);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.log("Error fetching data: ", err);
          setIsLoading(false);
          setNotaSent([]);
          setNotasReceived([]);
          setNotasInspected([]);
        });
    }
  }, [account, blockchainState.graphUrl, mapField]);

  useEffect(() => {
    refresh();
  }, [refresh, account]);

  const notasSentIncludingOptimistic = useMemo(() => {
    if (notasSent === undefined) {
      return undefined;
    }

    const sentNotaIds = notasSent.reduce((prev, nota) => {
      return [...prev, nota.id];
    }, []);

    const optimisticNotasFiltered = optimisticNotas.filter(
      (nota) =>
        !sentNotaIds.includes(nota.id) &&
        nota.payer === blockchainState.account
    );

    return optimisticNotasFiltered.concat(notasSent);
  }, [blockchainState.account, notasSent, optimisticNotas]);

  const notasReceivedIncludingOptimistic = useMemo(() => {
    if (notasReceived === undefined) {
      return undefined;
    }

    const receivedNotaIds = notasReceived.reduce((prev, nota) => {
      return [...prev, nota.id];
    }, []);

    const optimisticNotasFiltered = optimisticNotas.filter(
      (nota) =>
        !receivedNotaIds.includes(nota.id) &&
        nota.owner === blockchainState.account
    );
    return optimisticNotasFiltered.concat(notasReceived);
  }, [blockchainState.account, notasReceived, optimisticNotas]);

  const notas = useMemo(() => {
    if (
      notasReceived === undefined ||
      notasSent === undefined ||
      notasInspected === undefined ||
      isLoading
    ) {
      return undefined;
    }
    switch (notaField) {
      case "notasSent":
        return notasSentIncludingOptimistic;
      case "notasReceived":
        return notasReceivedIncludingOptimistic;
      default:
        return notasReceivedIncludingOptimistic
          .concat(notasSentIncludingOptimistic)
          .sort((a, b) => {
            return (
              b.createdTransaction.date.getTime() -
              a.createdTransaction.date.getTime()
            );
          });
    }
  }, [
    notasReceived,
    notasSent,
    notasInspected,
    isLoading,
    notaField,
    notasSentIncludingOptimistic,
    notasReceivedIncludingOptimistic,
  ]);

  return { notas, refresh, addOptimisticNota };
};
