import { ApolloClient, gql, InMemoryCache } from "@apollo/client";
import { contractMappingForChainId, ModuleData, NotaStatuses, NotaTransaction } from "@denota-labs/denota-sdk";
import { BigNumber, ethers } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NotaCurrency } from "../components/designSystem/CurrencyIcon";
import { useBlockchainData } from "../context/BlockchainDataProvider";
import { useTokens } from "./useTokens";

interface Props {
  notaField: string;
}

//////////// TODO need to set and pull the above from the SDK ////////////
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
  isInspector: boolean;  // TODO: remove since should be in moduleData
  uri: string;
  inspector?: string;  // TODO: remove since should be in moduleData
}
//////////// TODO need to set and pull the above from the SDK ////////////

const convertExponent = (amountExact: number, exponent: number) => {
  const adjustedExponent = exponent - 3;
  return Number(BigInt(amountExact) / BigInt(10 ** adjustedExponent)) / 1000;
};

export const useNotas = ({ notaField }: Props) => {
  const { blockchainState } = useBlockchainData();
  const account = blockchainState.account.toLowerCase();
  // const chainId = Number(blockchainState.chainId);

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

      const isPayer = gqlNota.sender.id === account;

      let isInspector = false; // TODO: expect inside module data

      let moduleData: ModuleData;
      // if (!gqlNota?.moduleData?.raw) {
      //   console.log(gqlNota.module.id);
      //   moduleData = { moduleName: "unknown", status: "?" };
      // } else {
      //   moduleData = getModuleData(account, chainId, gqlNota.module.id.toLowerCase(), gqlNota.moduleData.raw);
      // }
      // TODO take these from SDK
      let status: NotaStatuses; // let status = "paid" | "claimable" | "awaiting_claim" | "awaiting_release" | "releasable" | "released" | "claimed" | "expired" | "returnable" | "returned" | "locked" | "?";
      const mapping = contractMappingForChainId(blockchainState.chhainIdNumber);
      let coder = new ethers.utils.AbiCoder();
      switch (gqlNota.module.id) {
        case mapping.simpleCash.toLowerCase():
          const decoded = coder.decode(["string", "string"], gqlNota.moduleData.raw);

          if (gqlNota.cashes.length > 0) {
            status = "claimed";
          } else if (gqlNota.owner.id === account) {
            status = "claimable";
          } else {
            status = "awaiting_claim";
          }
          moduleData = {
            moduleName: "simpleCash",
            status,
          };
          break;
        case mapping.cashBeforeDate.toLowerCase():
          let decoded1 = coder.decode(["uint256", "string", "string"], gqlNota.moduleData.raw);
          let expirationDate = decoded1[0];

          if (gqlNota.cashes.length > 0) {
            if (gqlNota.cashes[0].to == account) {
              status = "claimed";
            } else {
              status = "returned";
            }
          } else if (expirationDate >= Date.now()) {
            if (gqlNota.owner.id === account) {
              status = "claimable";
            } else {
              status = "awaiting_claim";
            }
          } else {
            if (gqlNota.owner.id === account) {
              status = "expired";
            } else {
              status = "returnable";
            }
          }

          moduleData = {
            moduleName: "cashBeforeDate",
            cashBeforeDate: expirationDate,
            status,
          };
          break;
        case "0x000000005891889951d265d6d7ad3444b68f8887".toLowerCase():  // TODO remove
          let decoded6 = coder.decode(["uint256", "string", "string"], gqlNota.moduleData.raw);
          let expirationDate2 = decoded6[0];

          if (gqlNota.cashes.length > 0) {
            if (gqlNota.cashes[0].to == account) {
              status = "claimed";
            } else {
              status = "returned";
            }
          } else if (expirationDate2 >= Date.now()) {
            if (gqlNota.owner.id === account) {
              status = "claimable";
            } else {
              status = "awaiting_claim";
            }
          } else {
            if (gqlNota.owner.id === account) {
              status = "expired";
            } else {
              status = "returnable";
            }
          }

          moduleData = {
            moduleName: "cashBeforeDate",
            cashBeforeDate: expirationDate2,
            status,
          };
          break;
        case "0x00000000e8c13602e4d483a90af69e7582a43373".toLowerCase():  // CashBeforeDateDrip
          let decoded2 = coder.decode(["uint256", "uint256", "uint256", "string", "string"], gqlNota.moduleData.raw);
          let lastDrip = 0;
          let dripAmount = decoded2[0];
          let dripPeriod = decoded2[1];
          let cashBeforeDate = decoded2[2];

          if (cashBeforeDate < Date.now()) { // expired for owner
            if (gqlNota.sender.id == account) {
              if (gqlNota.escrow != 0) {
                status = "returnable";
              } else {
                status = "returned";
              }
            } else {
              status = "expired";
            }
          } else if (lastDrip + dripPeriod <= Date.now()) {
            if (gqlNota.owner.id == account) {
              if (gqlNota.escrow > dripAmount) {
                status = "claimable";
              } else {
                status = "locked";
              }
            } else {
              if (gqlNota.escrow > dripAmount) {
                status = "awaiting_claim";
              } else {
                status = "locked";
              }
            }
          } else {
            status = "locked";
          }

          moduleData = {
            moduleName: "cashBeforeDateDrip",
            expirationDate: cashBeforeDate,
            dripAmount: dripAmount,
            dripPeriod: dripPeriod,
            status,
          };
          break;
        case "0x00000000123157038206fefeb809823016331ff2".toLowerCase():  // CashBeforeDate
          let decoded9 = coder.decode(["uint256", "string", "string"], gqlNota.moduleData.raw);
          let expirationDate4 = decoded9[0];

          if (gqlNota.cashes.length > 0) {
            if (gqlNota.cashes[0].to == account) {
              status = "claimed";
            } else {
              status = "returned";
            }
          } else if (expirationDate4 >= Date.now()) {
            if (gqlNota.owner.id === account) {
              status = "claimable";
            } else {
              status = "awaiting_claim";
            }
          } else {
            if (gqlNota.owner.id === account) {
              status = "expired";
            } else {
              status = "returnable";
            }
          }

          moduleData = {
            moduleName: "cashBeforeDate",
            cashBeforeDate: expirationDate4,
            status,
          };
          break;
        case "0x00000000cce992072e23cda23a1986f2207f5e80".toLowerCase(): // CashBeforeDateDrip
          let decoded0 = [0, 0, 0];//coder.decode(["uint256", "uint256", "uint256", "string", "string"], gqlNota.moduleData.raw);
          let lastDrip0 = 0;
          let dripAmount0 = decoded0[0];
          let dripPeriod0 = decoded0[1];
          let cashBeforeDate0 = decoded0[2];

          if (cashBeforeDate0 < Date.now()) { // expired for owner
            if (gqlNota.sender.id == account) {
              if (gqlNota.escrow != 0) {
                status = "returnable";
              } else {
                status = "returned";
              }
            } else {
              status = "expired";
            }
          } else if (lastDrip0 + dripPeriod0 <= Date.now()) {
            if (gqlNota.owner.id == account) {
              if (gqlNota.escrow > dripAmount) {
                status = "claimable";
              } else {
                status = "locked";
              }
            } else {
              if (gqlNota.escrow > dripAmount0) {
                status = "awaiting_claim";
              } else {
                status = "locked";
              }
            }
          } else {
            status = "locked";
          }

          moduleData = {
            moduleName: "cashBeforeDateDrip",
            expirationDate: cashBeforeDate0,
            dripAmount: dripAmount0,
            dripPeriod: dripPeriod0,
            status,
          };
          break;
        case mapping.reversibleRelease.toLowerCase():
          let decoded3 = coder.decode(["address", "string", "string"], gqlNota.moduleData.raw);
          let inspector = decoded3[0].toLowerCase();  // TODO not showing that it is releasable

          if (gqlNota.cashes.length > 0) {
            // TODO Need to know if the `to` went to the `owner` at the time it was released
            //// Need to check transfers and if >0 check if the cash timestamp was before it
            if (gqlNota.cashes[0].to === gqlNota.owner.id) {
              status = "released";
            } else {
              status = "returned";
            }
          } else {
            if (inspector === account) {
              status = "releasable";
            } else {
              status = "awaiting_release";
            }
          }

          moduleData = {
            moduleName: "reversibleRelease",
            inspector: inspector,
            status,
          };
          break;
        case mapping.cashBeforeDateDrip.toLowerCase():
          let decoded4 = coder.decode(["address", "uint256", "string", "string"], gqlNota.moduleData.raw);
          let inspector1 = decoded4[0].toLowerCase();
          let expirationDate1 = decoded4[1];

          if (gqlNota.cashes.length > 0) {
            // TODO Need to know if the `to` went to the `owner` at the time it was released
            //// Need to check transfers and if >0 check if the cash timestamp was before it
            if (gqlNota.cashes[0].to == gqlNota.owner.id) {
              if (gqlNota.cashes[0].caller == inspector1) {
                status = "released";
              } else {
                status = "claimed";
              }
            } else {
              status = "returned";
            }
          } else if (expirationDate1 > Date.now()) {  // Depends on inspector to release
            if (inspector1 === account) {
              status = "releasable";
            } else {
              status = "awaiting_release";
            }
          } else if (gqlNota.owner.id === account) {
            status = "claimable";
          } else {
            status = "awaiting_claim";
          }

          moduleData = {
            moduleName: "reversibleByBeforeDate",
            inspector: inspector1,
            reversibleByBeforeDate: expirationDate1,
            status,
          };
          break;
        case "0x00000003672153A114583FA78C3D313D4E3cAE40".toLowerCase(): // DirectSend
          const decoded5 = coder.decode(["string", "string"], gqlNota.moduleData.raw);
          moduleData = { moduleName: "directSend", status: "paid" };
          break;
        case mapping.directSend.toLowerCase(): // DirectSend
          const decoded8 = coder.decode(["string", "string"], gqlNota.moduleData.raw);
          moduleData = { moduleName: "directSend", status: "paid" };
          break;
        case mapping.reversibleByBeforeDate.toLowerCase():
          let decoded7 = coder.decode(["address", "uint256", "string", "string"], gqlNota.moduleData.raw);
          let inspector2 = decoded7[0];
          let expirationDate3 = decoded7[1];

          if (gqlNota.cashes.length > 0) {
            if (gqlNota.cashes[0].to == account) {
              status = "claimed";
            } else {
              status = "returned";
            }
          } else if (expirationDate3 < Date.now()) {
            if (gqlNota.owner.id === account) {
              status = "claimable";
            } else {
              status = "awaiting_claim";
            }
          } else {
            if (inspector2 === account) {
              status = "releasable";
            } else {
              status = "awaiting_release";
            }
          }

          moduleData = {
            moduleName: "reversibleByBeforeDate",
            inspector: inspector2,
            reversibleByBeforeDate: expirationDate3,
            status,
          };
          break;
        default:
          moduleData = {
            moduleName: "unknown",
            status: "?",
          };
      }
      // TODO take these from SDK

      const amount = moduleData.moduleName === "directSend"
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
      account,
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
        to
        transaction {
          timestamp
        }
      }
      transfers {
        transaction {
          timestamp
        }
      }
      written {
        instant
        escrowed
      }
      `;

      // TODO: pagination
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
            account: account,
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
        nota.payer === account
    );

    return optimisticNotasFiltered.concat(notasSent);
  }, [account, notasSent, optimisticNotas]);

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
        nota.owner === account
    );
    // TODO need to filter duplicate notas (sent and received)
    return optimisticNotasFiltered.concat(notasReceived);
  }, [account, notasReceived, optimisticNotas]);

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
